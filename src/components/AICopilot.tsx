import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PorscheRecord } from '../types';
import { Send, Sparkles, User, BrainCircuit, CornerDownLeft, Loader2, RefreshCw } from 'lucide-react';

interface AICopilotProps {
  records: PorscheRecord[];
  hasSanitized: boolean;
  onRunSanitize: () => void;
}

export default function AICopilot({ records, hasSanitized, onRunSanitize }: AICopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Olá! Eu sou o **Porsche Sales Sanitizer Agent**, seu co-piloto especializado em auditoria de qualidade de dados. \n\nAcabei de analisar a planilha `Planilha base Porsche.csv` e estou pronto para ajudá-lo a limpá-la seguindo as regras de `schema.md`, ou responder qualquer dúvida analítica sobre as transações!\n\n**O que você gostaria de fazer primeiro?**',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick suggestions
  const suggestions = [
    'Quais são as principais anomalias encontradas na planilha?',
    'Qual modelo teve o maior faturamento total?',
    'Quantos registros têm datas inválidas e por quê?',
    'Gere um resumo executivo das vendas por Estado'
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle send message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    
    // Animate loading steps to look beautiful
    const steps = [
      'Consultando registros originais...',
      'Cruzando com as regras do schema.md...',
      'Analisando inconsistências...',
      'Invocando modelo Gemini 3.5-Flash...'
    ];
    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setLoadingStep(steps[stepIndex]);
    }, 1500);

    try {
      // Calculate basic context to feed the server agent
      const totalRecords = records.length;
      const invalidDates = records.filter(r => r.SaleDateSanitized === 'INVALID').length;
      const invalidYears = records.filter(r => r.ModelYearSanitized === 'INVALID').length;
      const invalidStates = records.filter(r => r.StateSanitized === 'INVALID').length;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          dataContext: {
            totalRecords,
            hasSanitized,
            invalidDates,
            invalidYears,
            invalidStates
          }
        })
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: data.text || 'Desculpe, tive um problema ao analisar os dados.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (error: any) {
      clearInterval(stepInterval);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `Erro ao chamar o Agente de IA: ${error.message}. Por favor, verifique se a sua API Key está configurada ou se os servidores estão prontos.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[550px]" id="aicopilot-component">
      {/* Copilot Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between" id="copilot-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm">
            <BrainCircuit className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center">
              Agente de IA Porsche
              <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-semibold border border-indigo-200 flex items-center">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Gemini Active
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">Auditor Digital Inteligente</p>
          </div>
        </div>
        
        {/* Quick run button if not sanitized yet */}
        {!hasSanitized && (
          <button 
            onClick={onRunSanitize}
            className="flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Executar Sanitização</span>
          </button>
        )}
      </div>

      {/* Chat Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30" id="chat-messages-container">
        {messages.map((msg, idx) => {
          const isModel = msg.role === 'model';
          return (
            <div 
              key={idx} 
              className={`flex space-x-3 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse space-x-reverse'}`}
              id={`chat-bubble-${idx}`}
            >
              {/* Avatar icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                isModel ? 'bg-slate-800 text-slate-100' : 'bg-indigo-600 text-white'
              }`}>
                {isModel ? <BrainCircuit className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message text with formatting */}
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                isModel 
                  ? 'bg-white text-slate-800 border-slate-100 shadow-sm rounded-tl-none' 
                  : 'bg-slate-900 text-slate-100 border-slate-900 rounded-tr-none'
              }`}>
                {/* Parse simple bold markdown and newlines */}
                <div className="space-y-2 whitespace-pre-wrap">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => {
                    // Quick parsing of markdown bold (**text**)
                    const parts = paragraph.split('**');
                    return (
                      <p key={pIdx}>
                        {parts.map((part, partIdx) => {
                          if (partIdx % 2 === 1) {
                            return <strong key={partIdx} className="font-bold text-indigo-600">{part}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-400 mt-2 text-right">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex space-x-3 mr-auto max-w-[80%]" id="chat-loading-bubble">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-100 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
              <Loader2 className="w-4 h-4 text-slate-900 animate-spin" />
              <span className="text-xs text-slate-500 font-medium italic">{loadingStep}</span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length < 4 && !isLoading && (
        <div className="p-3 border-t border-slate-100 bg-white/50 flex flex-wrap gap-1.5" id="suggestion-chips">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSendMessage(s)}
              className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 py-1 px-2.5 rounded-full font-semibold transition-all cursor-pointer text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Box */}
      <div className="p-3 bg-white border-t border-slate-100" id="chat-input-container">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder={isLoading ? "O Agente está pensando..." : "Pergunte ao Co-piloto sobre a qualidade dos dados Porsche..."}
            disabled={isLoading}
            className="flex-1 bg-slate-50 text-xs border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-slate-950/10 text-slate-700"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="w-10 h-10 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

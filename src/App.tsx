import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PorscheRecord, SanitizationLog } from './types';
import Dashboard from './components/Dashboard';
import DataViewer from './components/DataViewer';
import AgentLogs from './components/AgentLogs';
import AICopilot from './components/AICopilot';
import RulesViewer from './components/RulesViewer';
import { sanitizeRecords, parseCSV } from './utils/sanitizer';
import { 
  Play, 
  Download, 
  UploadCloud, 
  RotateCcw, 
  BarChart3, 
  TableProperties, 
  Terminal, 
  BrainCircuit, 
  BookOpen, 
  ShieldAlert, 
  Sparkles, 
  HelpCircle,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  const [originalRecords, setOriginalRecords] = useState<PorscheRecord[]>([]);
  const [sanitizedRecords, setSanitizedRecords] = useState<PorscheRecord[]>([]);
  const [logs, setLogs] = useState<SanitizationLog[]>([]);
  const [hasSanitized, setHasSanitized] = useState(false);
  const [schemaContent, setSchemaContent] = useState('');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'viewer' | 'logs' | 'ai' | 'rules'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('Planilha base Porsche.csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic health score calculation
  const healthScore = useMemo(() => {
    if (hasSanitized) return 100;
    if (originalRecords.length === 0) return 100;
    
    let invalidCount = 0;
    originalRecords.forEach(r => {
      const dateStr = r.sale_date || '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        invalidCount++;
        return;
      }
      const yr = r.porsche_model_year || r.model_year || '';
      if (isNaN(Number(yr)) || yr.length !== 4) {
        invalidCount++;
        return;
      }
      const st = r.state || '';
      if (st.length !== 2) {
        invalidCount++;
      }
    });

    const score = Math.round(((originalRecords.length - invalidCount) / originalRecords.length) * 100);
    return Math.max(score, 10);
  }, [originalRecords, hasSanitized]);

  // Load base data on startup
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      if (data.originalRecords) {
        setOriginalRecords(data.originalRecords);
      }
      if (data.sanitizedRecords && data.sanitizedRecords.length > 0) {
        setSanitizedRecords(data.sanitizedRecords);
        setHasSanitized(true);
        // ESM function call
        const { logs: localLogs } = sanitizeRecords(data.originalRecords);
        setLogs(localLogs);
      } else {
        setSanitizedRecords([]);
        setHasSanitized(false);
        setLogs([]);
      }
      if (data.schemaContent) {
        setSchemaContent(data.schemaContent);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Sanitization Agent
  const handleRunSanitization = async (customCsvText?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sanitize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCsvText })
      });
      const data = await response.json();
      if (data.success) {
        setSanitizedRecords(data.sanitizedRecords);
        setLogs(data.logs);
        setHasSanitized(true);
        if (customCsvText) {
          const parsedRecords: PorscheRecord[] = [];
          const lines = parseCSV(customCsvText);
          if (lines.length > 0) {
            const headers = lines[0];
            for (let i = 1; i < lines.length; i++) {
              const row = lines[i];
              if (row.length === 0) continue;
              const rec: any = {};
              headers.forEach((h: string, colIndex: number) => {
                rec[h] = row[colIndex] || "";
              });
              parsedRecords.push(rec as PorscheRecord);
            }
          }
          setOriginalRecords(parsedRecords);
        }
      } else {
        alert('Erro ao sanitizar dados: ' + data.error);
      }
    } catch (error) {
      console.error('Error running sanitization:', error);
      alert('Erro ao conectar com o servidor para sanitização.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download Sanitized CSV file
  const handleDownloadSanitized = () => {
    window.open('/api/download', '_blank');
  };

  // Reset Sanitization State
  const handleReset = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/reset', { method: 'POST' });
      setFileName('Planilha base Porsche.csv');
      await fetchData();
    } catch (error) {
      console.error('Error resetting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom File Upload via Drag & Drop or Browse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleRunSanitization(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" id="porsche-app-root">
      {/* Top Header Navigation - Professional Polish White Background */}
      <header className="bg-white border-b border-slate-200 shadow-sm shrink-0" id="app-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-extrabold text-base tracking-tight shadow-sm">
              911
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center">
                Porsche Sales Sanitizer
                <span className="ml-2.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded border border-emerald-200 font-semibold">
                  {hasSanitized ? 'Agente Ativo' : 'Aguardando'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Auditoria inteligente baseada no schema.md corporativo</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3" id="header-action-buttons">
            {/* Run Sanitization Button */}
            {!hasSanitized ? (
              <button
                onClick={() => handleRunSanitization()}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl border border-slate-900 shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Sanitizar Base Porsche</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Download Button */}
                <button
                  onClick={handleDownloadSanitized}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Planilha Tratada</span>
                </button>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
                  title="Resetar e voltar para planilha original"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Resetar</span>
                </button>
              </div>
            )}

            {/* Custom file upload input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Carregar CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Warning/Info Banner about state */}
      {!hasSanitized && (
        <div className="bg-amber-500/10 border-b border-amber-200 py-3 px-6 text-center shadow-inner" id="state-warning-banner">
          <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-xs font-semibold text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Planilha bruta <strong>"{fileName}"</strong> carregada com {originalRecords.length} transações, mas ainda não sanitizada.</span>
            <button 
              onClick={() => handleRunSanitization()}
              className="underline text-indigo-600 hover:text-indigo-500 font-bold ml-1 shrink-0"
            >
              Clique para rodar o Agente e corrigir as anomalias
            </button>
          </div>
        </div>
      )}

      {/* Main Body with Sidebar Layout for Professional Polish Theme */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-6" id="app-main">
        
        {/* Left Side: Pipeline, Integridade & Stats */}
        <aside className="w-full lg:w-72 flex flex-col gap-6 shrink-0" id="app-sidebar">
          
          {/* Data Health Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Qualidade da Base</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {healthScore}%
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                hasSanitized 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {hasSanitized ? 'Fiel' : 'Pendente'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {hasSanitized 
                ? 'Todos os registros estão devidamente normalizados e prontos para relatórios.' 
                : 'Esta base possui anomalias que requerem correção imediata para auditoria.'}
            </p>
            {/* Health Score Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
              <div 
                className={`h-full transition-all duration-700 ease-out ${hasSanitized ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${healthScore}%` }}
              ></div>
            </div>
          </div>

          {/* Processing Pipeline steps */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pipeline de Processamento</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">1. Leitura do Base CSV</h4>
                  <p className="text-[10px] text-slate-500">Colunas mapeadas e prontas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">2. Mapeamento de Regras</h4>
                  <p className="text-[10px] text-slate-500">Parâmetros do schema.md.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                  hasSanitized 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200 animate-pulse'
                }`}>
                  {hasSanitized ? '✓' : '3'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">3. Tratamento e Auditoria</h4>
                  <p className="text-[10px] text-slate-500">Análise de milhas, datas e preços.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                  hasSanitized 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {hasSanitized ? '✓' : '4'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">4. Geração do Arquivo</h4>
                  <p className="text-[10px] text-slate-500">Criação de colunas sanitizadas.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Tab Bar, File Info, Active tab content */}
        <section className="flex-1 flex flex-col space-y-6 overflow-hidden min-w-0" id="app-content-area">
          
          {/* Navigation Tabs and File Name details */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm" id="nav-tabs-bar">
            <div className="flex flex-wrap gap-1" id="nav-tabs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Painel Geral</span>
              </button>

              <button
                onClick={() => setActiveTab('viewer')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'viewer'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TableProperties className="w-4 h-4" />
                <span>Auditor Comparativo</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>Console de Logs</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Copiloto de IA</span>
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Regras do Schema</span>
              </button>
            </div>

            {/* Current file name display */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 shrink-0 text-xs font-medium text-slate-600" id="current-file-badge">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>Arquivo: </span>
              <span className="font-mono text-slate-900 font-semibold">{fileName}</span>
              {hasSanitized ? (
                <span className="ml-1 px-1.5 py-0.2 bg-green-50 border border-green-200 text-green-800 text-[9px] rounded font-bold uppercase tracking-wider flex items-center">
                  <CheckCircle className="w-3 h-3 mr-0.5 text-green-600" /> Sanitizado
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-50 border border-amber-200 text-amber-800 text-[9px] rounded font-bold uppercase tracking-wider">Bruto</span>
              )}
            </div>
          </div>

          {/* Dynamic Loading Overlay */}
          {isLoading && (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm" id="global-loading-view">
              <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Processando Regras de Negócio</h3>
              <p className="text-xs text-slate-500 mt-1">Normalizando registros e preenchendo colunas auditadas...</p>
            </div>
          )}

          {/* Navigation Tabs Screens */}
          {!isLoading && (
            <div className="animate-fade-in" id="active-tab-container">
              {activeTab === 'dashboard' && (
                <Dashboard records={hasSanitized ? sanitizedRecords : originalRecords} />
              )}

              {activeTab === 'viewer' && (
                <DataViewer originalRecords={originalRecords} sanitizedRecords={sanitizedRecords} />
              )}

              {activeTab === 'logs' && (
                <AgentLogs logs={logs} />
              )}

              {activeTab === 'ai' && (
                <AICopilot 
                  records={hasSanitized ? sanitizedRecords : originalRecords} 
                  hasSanitized={hasSanitized} 
                  onRunSanitize={() => handleRunSanitization()} 
                />
              )}

              {activeTab === 'rules' && (
                <RulesViewer />
              )}
            </div>
          )}
        </section>
      </main>

      {/* Global simple footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-semibold shrink-0" id="app-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Porsche Sales Sanitizer Agent © {new Date().getFullYear()}</span>
          <span className="text-[10px] text-slate-400">Desenvolvido em conformidade com as regras rígidas do schema de auditoria da Porsche</span>
        </div>
      </footer>
    </div>
  );
}

// Inline fallback loader helper for lucide-react if needed
function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

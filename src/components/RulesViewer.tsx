import React from 'react';
import { Calendar, Car, Tag, DollarSign, MapPin, CreditCard, ShieldAlert } from 'lucide-react';

export default function RulesViewer() {
  const rules = [
    {
      title: 'Limpeza de Datas',
      icon: <Calendar className="w-5 h-5 text-indigo-500" />,
      desc: 'Padroniza datas no formato ISO YYYY-MM-DD. Rejeita automaticamente datas inválidas no calendário, como 30 de fevereiro ou 31 de abril.',
      examples: [
        { from: '03/14/2024', to: '2024-03-14' },
        { from: '2024-02-30', to: 'INVALID (Fevereiro)' },
        { from: 'April 31st, 2024', to: 'INVALID (Abril de 30 dias)' },
      ],
    },
    {
      title: 'Modelos Porsche',
      icon: <Car className="w-5 h-5 text-indigo-500" />,
      desc: 'Normaliza os nomes de modelos de acordo com o catálogo oficial de trims da marca em Title Case. Preserva trims especiais como GTS, RS, GT3.',
      examples: [
        { from: '911 turbo s', to: '911 Turbo S' },
        { from: 'taycan cross turismo', to: 'Taycan Cross Turismo' },
        { from: 'macan electric', to: 'Macan Electric' },
      ],
    },
    {
      title: 'Ano do Modelo',
      icon: <Tag className="w-5 h-5 text-amber-500" />,
      desc: 'Garante o ano com 4 dígitos. Traduz descrições em inglês ("twenty twenty four"). Limita anos entre 1990 e 2035, marcando outros como INVALID.',
      examples: [
        { from: 'twenty twenty four', to: '2024' },
        { from: '20-23', to: '2023' },
        { from: '1985', to: 'INVALID (< 1990)' },
      ],
    },
    {
      title: 'Preço de Venda',
      icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
      desc: 'Garante um número decimal limpo sem símbolos de cifrão, moedas textuais ou abreviações de milhar ("k").',
      examples: [
        { from: '$121k', to: '121000.00' },
        { from: '188k USD', to: '188000.00' },
        { from: 'eighty two thousand USD', to: '82000.00' },
      ],
    },
    {
      title: 'Quilometragem',
      icon: <MapPin className="w-5 h-5 text-cyan-500" />,
      desc: 'Converte a quilometragem para número inteiro em milhas. Identifica explicitamente o prefixo "KM" e multiplica por 0.621371. Normaliza "new" e "zero" para 0.',
      examples: [
        { from: 'KM 18,900', to: '11744 (18900 * 0.621371)' },
        { from: 'twelve thousand miles', to: '12000' },
        { from: 'new car', to: '0' },
      ],
    },
    {
      title: 'Método de Pagamento',
      icon: <CreditCard className="w-5 h-5 text-sky-500" />,
      desc: 'Mapeia e valida para termos controlados da concessionária, como Credit Card, Debit Card, Wire Transfer, Financing, Lease, Cash, ACH Payment ou Crypto Payment.',
      examples: [
        { from: 'bank wire', to: 'Wire Transfer' },
        { from: 'Financing plan', to: 'Financing' },
        { from: 'crypto payment', to: 'Crypto Payment' },
      ],
    },
    {
      title: 'Estados dos EUA',
      icon: <MapPin className="w-5 h-5 text-indigo-600" />,
      desc: 'Normaliza os nomes de estados norte-americanos para o código USPS de duas letras maiúsculas. Caso o estado não pertença aos EUA, retorna INVALID.',
      examples: [
        { from: 'california', to: 'CA' },
        { from: 'New York', to: 'NY' },
        { from: 'ma', to: 'MA' },
      ],
    },
    {
      title: 'Status de Entrega',
      icon: <ShieldAlert className="w-5 h-5 text-teal-500" />,
      desc: 'Traduz o status para a lista de termos controlados, removendo pontos de exclamação e corrigindo typos frequentes como DELIVERD.',
      examples: [
        { from: 'delivered!!!', to: 'Delivered' },
        { from: 'DELIVERD', to: 'Delivered' },
        { from: 'in-transit', to: 'In Transit' },
      ],
    },
  ];

  return (
    <div className="space-y-6" id="rulesviewer-component">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start space-x-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Regras de Auditoria Aplicadas (schema.md)</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            O Agente de Sanitização opera aplicando uma máquina de estados e regras determinísticas rigorosas sobre cada linha. 
            Todas as ações são registradas no terminal de logs e os valores inconsistentes são convertidos para <code className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded font-mono">INVALID</code> para assegurar que não haja poluição de dados (AI-Slop ou nulos) no banco de dados corporativo da Porsche.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="rules-grid">
        {rules.map((rule, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all space-y-4" id={`rule-card-${idx}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-50 rounded-xl">{rule.icon}</div>
              <h4 className="font-bold text-slate-800 text-sm">{rule.title}</h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              {rule.desc}
            </p>

            {/* Examples table */}
            <div className="bg-slate-50 rounded-xl p-3 text-[11px] space-y-2 font-mono">
              <span className="text-slate-400 font-semibold block text-[9px] uppercase tracking-wider">Exemplos de Conversão:</span>
              <div className="divide-y divide-slate-100">
                {rule.examples.map((ex, exIdx) => (
                  <div key={exIdx} className="flex justify-between py-1.5 first:pt-0 last:pb-0">
                    <span className="text-slate-500 max-w-[150px] truncate">"{ex.from}"</span>
                    <span className="text-slate-400">→</span>
                    <span className={`font-semibold truncate ${ex.to.includes('INVALID') ? 'text-red-500' : 'text-indigo-600'}`}>"{ex.to}"</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

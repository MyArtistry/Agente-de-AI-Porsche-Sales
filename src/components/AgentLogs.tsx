import React, { useState, useMemo } from 'react';
import { SanitizationLog } from '../types';
import { Shield, CheckCircle, AlertCircle, Info, Terminal, Search, Filter } from 'lucide-react';

interface AgentLogsProps {
  logs: SanitizationLog[];
}

export default function AgentLogs({ logs }: AgentLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'success' | 'info' | 'error'>('all');
  const [selectedField, setSelectedField] = useState<string>('all');

  // Fields list for filtering
  const uniqueFields = useMemo(() => {
    const fields = new Set<string>();
    logs.forEach(l => fields.add(l.field));
    return Array.from(fields).sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search search term
      const matchSearch = 
        log.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.rowId.toString().includes(searchTerm) ||
        log.originalValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.sanitizedValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return false;

      // Status filter
      if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;

      // Field filter
      if (selectedField !== 'all' && log.field !== selectedField) return false;

      return true;
    });
  }, [logs, searchTerm, selectedStatus, selectedField]);

  // Calculate statistics of the logs
  const stats = useMemo(() => {
    const successCount = logs.filter(l => l.status === 'success').length;
    const errorCount = logs.filter(l => l.status === 'error').length;
    const infoCount = logs.filter(l => l.status === 'info').length;
    
    return {
      total: logs.length,
      success: successCount,
      error: errorCount,
      info: infoCount
    };
  }, [logs]);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-mono" id="agentlogs-component">
      {/* Console Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between" id="console-header">
        <div className="flex items-center space-x-2.5">
          <Terminal className="w-5 h-5 text-indigo-500 animate-pulse" />
          <span className="text-sm font-bold tracking-wider text-slate-200">Terminal do Agente Sanitizador Porsche v1.0</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Pronto para Auditar</span>
        </div>
      </div>

      {/* Stats counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-800 bg-slate-950/40 text-xs py-3 divide-x divide-slate-800" id="console-stats">
        <div className="px-6 py-1">
          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Ações Totais</span>
          <span className="text-lg font-bold text-slate-200">{stats.total}</span>
        </div>
        <div className="px-6 py-1">
          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider text-emerald-400">Sucessos / Modificações</span>
          <span className="text-lg font-bold text-emerald-400">{stats.success}</span>
        </div>
        <div className="px-6 py-1">
          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider text-red-400">Inconsistências (INVALID)</span>
          <span className="text-lg font-bold text-red-400">{stats.error}</span>
        </div>
        <div className="px-6 py-1">
          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider text-sky-400">Validados Sem Mudança</span>
          <span className="text-lg font-bold text-sky-400">{stats.info}</span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4" id="console-filters-bar">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar log (Id, Cliente, Valor original, Detalhes)..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs" id="console-selectors">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Status:</span>
            <select
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded py-1 px-2 focus:outline-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="success">Sucesso (Modificado)</option>
              <option value="error">Erros (INVALID)</option>
              <option value="info">Informação (Validado)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Coluna:</span>
            <select
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded py-1 px-2 focus:outline-none"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
            >
              <option value="all">Todas</option>
              {uniqueFields.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Scroll Window */}
      <div className="h-[450px] overflow-y-auto p-4 space-y-2 bg-slate-950/80 scrollbar-thin scrollbar-thumb-slate-800" id="logs-container">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Terminal className="w-8 h-8 text-slate-700 mb-2" />
            Nenhuma linha de log atende aos critérios de pesquisa.
          </div>
        ) : (
          filteredLogs.map((log) => {
            let statusIcon = <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
            let statusColor = 'text-sky-400';
            let lineBg = 'bg-slate-900/30 border border-slate-900';

            if (log.status === 'success') {
              statusIcon = <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
              statusColor = 'text-emerald-400';
              lineBg = 'bg-emerald-950/10 border border-emerald-950/20';
            } else if (log.status === 'error') {
              statusIcon = <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
              statusColor = 'text-red-400';
              lineBg = 'bg-red-950/10 border border-red-950/20';
            }

            return (
              <div key={log.id} className={`p-3 rounded-lg text-xs flex items-start space-x-3 transition-all ${lineBg}`} id={`log-item-${log.id}`}>
                {/* Status Indicator */}
                <div className="mt-0.5">{statusIcon}</div>

                {/* Log Line Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-slate-300">
                      Row <span className="text-indigo-400">#{log.rowId}</span> — Cliente: <span className="text-slate-100">{log.customerName}</span>
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-slate-900 text-slate-400`}>
                      Col: {log.field}
                    </span>
                  </div>

                  <p className="text-slate-400 mt-0.5 font-sans leading-relaxed">
                    {log.description}
                  </p>

                  {/* Original vs Sanitized Details */}
                  {log.status !== 'info' && (
                    <div className="flex items-center space-x-2 mt-1.5 pt-1 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                      <span>Orig: <span className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">"{log.originalValue}"</span></span>
                      <span>→</span>
                      <span>Sanitizado: <span className={`${statusColor} bg-slate-900 px-1 py-0.5 rounded font-bold`}>"{log.sanitizedValue}"</span></span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center" id="console-footer">
        <span>Fim da auditoria do agente. {filteredLogs.length} logs carregados.</span>
        <span>Modo: Automático (Regras de schema.md)</span>
      </div>
    </div>
  );
}

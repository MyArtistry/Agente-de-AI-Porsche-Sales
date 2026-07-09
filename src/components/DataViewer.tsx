import React, { useState, useMemo } from 'react';
import { PorscheRecord } from '../types';
import { Search, Filter, ArrowRight, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface DataViewerProps {
  originalRecords: PorscheRecord[];
  sanitizedRecords: PorscheRecord[];
}

export default function DataViewer({ originalRecords, sanitizedRecords }: DataViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'modified' | 'invalid'>('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Combine datasets for side-by-side rendering
  const combinedData = useMemo(() => {
    return originalRecords.map((orig) => {
      const sanitized = sanitizedRecords.find((s) => s.sale_id === orig.sale_id) || {};
      return {
        ...orig,
        sanitized
      };
    });
  }, [originalRecords, sanitizedRecords]);

  // Unique models list for filter dropdown
  const uniqueModels = useMemo(() => {
    const models = new Set<string>();
    sanitizedRecords.forEach((r) => {
      if (r.PorscheModelSanitized) models.add(r.PorscheModelSanitized);
    });
    return Array.from(models).sort();
  }, [sanitizedRecords]);

  // Apply filters
  const filteredData = useMemo(() => {
    return combinedData.filter((item) => {
      // 1. Search term check
      const query = searchTerm.toLowerCase();
      const matchSearch =
        item.customer_name?.toLowerCase().includes(query) ||
        item.porsche_model?.toLowerCase().includes(query) ||
        item.city?.toLowerCase().includes(query) ||
        item.state?.toLowerCase().includes(query) ||
        item.salesperson?.toLowerCase().includes(query) ||
        item.sale_id?.toString().includes(query);

      if (!matchSearch) return false;

      // 2. Model filter check
      if (selectedModel !== 'all') {
        const itemSanitModel = item.sanitized?.PorscheModelSanitized || '';
        if (itemSanitModel !== selectedModel) return false;
      }

      // 3. Sanitization category filter check
      if (filterType === 'modified') {
        // Any change from original value in important sanitizable fields
        const hasChange =
          item.sale_date !== item.sanitized?.SaleDateSanitized ||
          item.porsche_model !== item.sanitized?.PorscheModelSanitized ||
          item.model_year !== item.sanitized?.ModelYearSanitized ||
          item.sale_price !== item.sanitized?.SalesPriceSanitized ||
          item.vehicle_mileage !== item.sanitized?.VehicleMileageSanitized ||
          item.payment_method !== item.sanitized?.PayMethodSanitized ||
          item.city !== item.sanitized?.CitySanitized ||
          item.state !== item.sanitized?.StateSanitized ||
          item.delivery_status !== item.sanitized?.DeliveryStatusSanitized;
        
        if (!hasChange) return false;
      }

      if (filterType === 'invalid') {
        // Contains "INVALID" in date, year, or state
        const hasInvalid =
          item.sanitized?.SaleDateSanitized === 'INVALID' ||
          item.sanitized?.ModelYearSanitized === 'INVALID' ||
          item.sanitized?.StateSanitized === 'INVALID';
        
        if (!hasInvalid) return false;
      }

      return true;
    });
  }, [combinedData, searchTerm, filterType, selectedModel]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Helper to check if a value has changed
  const isChanged = (orig: string, sanit?: string) => {
    if (!sanit) return false;
    return orig.trim() !== sanit.trim();
  };

  // Helper to render side-by-side cells beautifully
  const renderCompareCell = (label: string, orig: string, sanit?: string, isInvalidCheck = false) => {
    const changed = isChanged(orig, sanit);
    const isInvalid = isInvalidCheck && sanit === 'INVALID';

    return (
      <div className="flex flex-col space-y-1 py-1 max-w-[200px]" id={`compare-${label}`}>
        {/* Original value */}
        <span className="text-xs text-slate-400 line-through truncate font-mono" title={`Original: ${orig}`}>
          {orig || <span className="italic text-slate-300">Vazio</span>}
        </span>
        
        {/* Sanitized value */}
        <div className="flex items-center space-x-1">
          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
          {isInvalid ? (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md flex items-center tracking-wider">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              INVALID
            </span>
          ) : (
            <span 
              className={`text-xs font-mono font-medium truncate px-1.5 py-0.5 rounded ${
                changed 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold' 
                  : 'text-slate-700'
              }`}
              title={`Sanitizado: ${sanit}`}
            >
              {sanit || <span className="italic text-slate-300">N/A</span>}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="dataviewer-component">
      {/* Search and Filters Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4" id="dataviewer-controls">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, modelo, cidade, vendedor, id..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900 transition-all text-slate-700"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2" id="dataviewer-filter-buttons">
            {/* Filter 1: Type */}
            <button
              onClick={() => { setFilterType('all'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos ({combinedData.length})
            </button>
            <button
              onClick={() => { setFilterType('modified'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center ${
                filterType === 'modified'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-indigo-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Modificados
            </button>
            <button
              onClick={() => { setFilterType('invalid'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center ${
                filterType === 'invalid'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-amber-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Inconsistências (INVALID)
            </button>
          </div>
        </div>

        {/* Extended filter dropdowns */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500" id="dataviewer-extended-filters">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtrar por Modelo Porsche:</span>
            <select
              className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todos os Modelos</option>
              {uniqueModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-slate-400">
            Exibindo {filteredData.length} de {combinedData.length} registros
          </div>
        </div>
      </div>

      {/* Side-by-side Table */}
      <div className="overflow-x-auto" id="compare-table-wrapper">
        <table className="w-full text-left border-collapse" id="compare-table">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4 w-12">ID</th>
              <th className="py-3 px-4">Cliente / Vendedor</th>
              <th className="py-3 px-4">Data Venda</th>
              <th className="py-3 px-4">Modelo Porsche</th>
              <th className="py-3 px-4">Ano Modelo</th>
              <th className="py-3 px-4">Preço (USD)</th>
              <th className="py-3 px-4">Milhas (Odom.)</th>
              <th className="py-3 px-4">Método Pagam.</th>
              <th className="py-3 px-4">Cidade / UF</th>
              <th className="py-3 px-4">Status Entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Nenhum registro encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.sale_id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700 align-top">
                  {/* Sale ID */}
                  <td className="py-4 px-4 font-bold text-slate-500">{item.sale_id}</td>
                  
                  {/* Customer / Salesperson */}
                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-900">{item.customer_name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center mt-0.5">
                      Vendedor: <span className="font-medium text-slate-500 ml-1">{item.salesperson}</span>
                    </div>
                  </td>
                  
                  {/* Sale Date compare */}
                  <td className="py-4 px-4">
                    {renderCompareCell('date', item.sale_date, item.sanitized?.SaleDateSanitized, true)}
                  </td>
                  
                  {/* Model compare */}
                  <td className="py-4 px-4">
                    {renderCompareCell('model', item.porsche_model, item.sanitized?.PorscheModelSanitized)}
                  </td>
                  
                  {/* Year compare */}
                  <td className="py-4 px-4">
                    {renderCompareCell('year', item.model_year, item.sanitized?.ModelYearSanitized, true)}
                  </td>
                  
                  {/* Price compare */}
                  <td className="py-4 px-4">
                    {renderCompareCell('price', item.sale_price, item.sanitized?.SalesPriceSanitized)}
                  </td>
                  
                  {/* Mileage compare */}
                  <td className="py-4 px-4">
                    {renderCompareCell('mileage', item.vehicle_mileage, item.sanitized?.VehicleMileageSanitized)}
                  </td>
                  
                  {/* Payment compare */}
                  <td className="py-4 px-4">
                    {renderCompareCell('payment', item.payment_method, item.sanitized?.PayMethodSanitized)}
                  </td>
                  
                  {/* City & State compare */}
                  <td className="py-4 px-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Cidade</span>
                        <span className="font-medium font-mono text-slate-800">{item.sanitized?.CitySanitized || item.city}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Estado</span>
                        {item.sanitized?.StateSanitized === 'INVALID' ? (
                          <span className="px-1 py-0.2 bg-red-100 text-red-700 text-[9px] font-bold rounded">INVALID</span>
                        ) : (
                          <span className="font-mono font-bold text-slate-900">{item.sanitized?.StateSanitized || item.state}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Delivery Status compare */}
                  <td className="py-4 px-4">
                    {renderCompareCell('delivery', item.delivery_status, item.sanitized?.DeliveryStatusSanitized)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between" id="dataviewer-pagination">
          <div className="text-xs text-slate-500 font-semibold">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-slate-200 text-xs font-semibold rounded-lg disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-50 transition-all text-slate-700"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Sliding window of page numbers
              let pageNum = currentPage - 2 + i;
              if (pageNum < 1) pageNum = i + 1;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-all ${
                    currentPage === pageNum
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white border border-slate-200 text-xs font-semibold rounded-lg disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-50 transition-all text-slate-700"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

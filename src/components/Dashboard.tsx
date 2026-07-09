import React, { useMemo } from 'react';
import { PorscheRecord } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Car, DollarSign, AlertCircle, TrendingUp, CheckCircle, MapPin } from 'lucide-react';

interface DashboardProps {
  records: PorscheRecord[];
}

export default function Dashboard({ records }: DashboardProps) {
  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        totalRecords: 0,
        totalSales: 0,
        invalidDates: 0,
        invalidYears: 0,
        invalidStates: 0,
        avgMileage: 0,
        invalidTotal: 0
      };
    }

    let totalSales = 0;
    let invalidDates = 0;
    let invalidYears = 0;
    let invalidStates = 0;
    let totalMileage = 0;
    let validMileageCount = 0;

    records.forEach(r => {
      // Sales price calculation
      const price = parseFloat(r.SalesPriceSanitized || '0');
      totalSales += isNaN(price) ? 0 : price;

      // Invalid dates count
      if (r.SaleDateSanitized === 'INVALID') {
        invalidDates++;
      }

      // Invalid years count
      if (r.ModelYearSanitized === 'INVALID') {
        invalidYears++;
      }

      // Invalid states count
      if (r.StateSanitized === 'INVALID') {
        invalidStates++;
      }

      // Mileage average calculation
      const mileage = parseInt(r.VehicleMileageSanitized || '0', 10);
      if (!isNaN(mileage)) {
        totalMileage += mileage;
        validMileageCount++;
      }
    });

    const invalidTotal = records.filter(r => 
      r.SaleDateSanitized === 'INVALID' || 
      r.ModelYearSanitized === 'INVALID' || 
      r.StateSanitized === 'INVALID'
    ).length;

    return {
      totalRecords: records.length,
      totalSales,
      invalidDates,
      invalidYears,
      invalidStates,
      avgMileage: validMileageCount > 0 ? Math.round(totalMileage / validMileageCount) : 0,
      invalidTotal
    };
  }, [records]);

  // Chart 1: Sales Count by Model
  const modelChartData = useMemo(() => {
    const counts: { [key: string]: { count: number; value: number } } = {};
    records.forEach(r => {
      const model = r.PorscheModelSanitized || r.porsche_model || 'Unknown';
      const price = parseFloat(r.SalesPriceSanitized || '0');
      if (!counts[model]) {
        counts[model] = { count: 0, value: 0 };
      }
      counts[model].count += 1;
      counts[model].value += isNaN(price) ? 0 : price;
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        Vendas: data.count,
        Faturamento: Math.round(data.value)
      }))
      .sort((a, b) => b.Vendas - a.Vendas)
      .slice(0, 8); // Top 8 models
  }, [records]);

  // Chart 2: Payment Method Distribution
  const paymentChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    records.forEach(r => {
      const method = r.PayMethodSanitized || r.payment_method || 'Other';
      counts[method] = (counts[method] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  // Chart 3: Delivery Status Breakdown
  const statusChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    records.forEach(r => {
      const status = r.DeliveryStatusSanitized || r.delivery_status || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  const COLORS = ['#4f46e5', '#0f172a', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#64748b', '#1e293b'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-8" id="dashboard-container">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpis-grid">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4" id="kpi-total-sales">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-xl border border-slate-200/50">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento Total</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(stats.totalSales)}
            </h3>
            <span className="text-xs text-green-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              100% Tratado e Consolidado
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4" id="kpi-total-records">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-xl border border-slate-200/50">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transações Totais</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {stats.totalRecords}
            </h3>
            <span className="text-xs text-slate-600 font-medium flex items-center mt-1">
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />
              Registros Ativos
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4" id="kpi-invalid-records">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Erros Corrigidos</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {stats.invalidTotal}
            </h3>
            <span className="text-xs text-amber-600 font-medium flex flex-wrap mt-1 gap-x-2">
              <span>{stats.invalidDates} datas</span> • 
              <span>{stats.invalidYears} anos</span> • 
              <span>{stats.invalidStates} estados</span>
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4" id="kpi-avg-mileage">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Média de Milhas</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {stats.avgMileage.toLocaleString()} mi
            </h3>
            <span className="text-xs text-slate-600 font-medium flex items-center mt-1">
              Conversão Automática (KM → Mi)
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-grid">
        {/* Chart 1: Top Models (Wide) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2" id="chart-models-sales">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-6">Modelos Mais Vendidos (Volume & Faturamento)</h3>
          <div className="h-80" id="models-bar-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11 } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(tick) => `$${Math.round(tick / 1000)}k`}
                  label={{ value: 'Faturamento (USD)', angle: 90, position: 'insideRight', style: { fill: '#64748b', fontSize: 11 } }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  formatter={(value: any, name: any) => {
                    if (name === 'Faturamento') return [formatCurrency(value), name];
                    return [value, name];
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="Vendas" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="right" dataKey="Faturamento" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payment Methods */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="chart-payment-methods">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-6">Métodos de Pagamento</h3>
          <div className="h-80 flex flex-col justify-between" id="payment-pie-chart-container">
            <div className="h-60 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom scrollable legend to look perfect */}
            <div className="overflow-y-auto max-h-24 px-2 space-y-1 text-xs text-slate-600" id="payment-legend">
              <div className="grid grid-cols-2 gap-2">
                {paymentChartData.slice(0, 8).map((entry, index) => (
                  <div key={entry.name} className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="truncate">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third row: Delivery Status & Map stats side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-row-3">
        {/* Delivery Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="dashboard-delivery-status">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-6">Status das Entregas</h3>
          <div className="h-64" id="delivery-bar-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State sales count map stats */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between" id="dashboard-top-states">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-1">Distribuição Geográfica</h3>
            <p className="text-xs text-slate-500 mb-6">Vendas por estados dos EUA (Top 5)</p>
          </div>
          
          <div className="space-y-4" id="states-progress-container">
            {Object.entries(
              records.reduce((acc: { [key: string]: number }, r) => {
                const state = r.StateSanitized || 'INVALID';
                acc[state] = (acc[state] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([state, count], index) => {
                const percentage = Math.round((count / records.length) * 100);
                return (
                  <div key={state} className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-800">{state === 'INVALID' ? '🚫 Não Identificado / Inválido' : `🇺🇸 Estado: ${state}`}</span>
                      <span className="text-slate-600">{count} vendas ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${state === 'INVALID' ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

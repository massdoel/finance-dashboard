import React, { useState, useEffect, useReducer, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, RefreshCw, CheckCircle2,
  AlertCircle, Clock, Zap, ArrowUpRight, ArrowDownRight,
  Webhook, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

// --- TYPES & INTERFACES ---
type TransactionType = 'income' | 'expense';
type WorkflowStatus = 'ingested' | 'categorizing' | 'pending_approval' | 'synced' | 'failed';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  workflowStatus: WorkflowStatus;
  source: string;
}

interface WorkflowState {
  isAutoReconciling: boolean;
  lastSync: string | null;
  webhookEvents: { id: string; message: string; timestamp: string }[];
}

type WorkflowAction =
  | { type: 'START_RECONCILE' }
  | { type: 'FINISH_RECONCILE' }
  | { type: 'ADD_WEBHOOK_EVENT'; payload: { message: string } };

// --- MOCK DATA ---
const initialTransactions: Transaction[] = [
  { id: '1', date: '2026-09-01', description: 'Penjualan Produk A', amount: 15000000, type: 'income', category: 'Penjualan', workflowStatus: 'synced', source: 'Bank API' },
  { id: '2', date: '2026-09-02', description: 'Langganan AWS', amount: 2500000, type: 'expense', category: 'Infrastruktur', workflowStatus: 'synced', source: 'Webhook' },
  { id: '3', date: '2026-09-05', description: 'Transfer Klien XYZ', amount: 8500000, type: 'income', category: 'Jasa', workflowStatus: 'categorizing', source: 'Bank API' },
  { id: '4', date: '2026-09-06', description: 'Pembelian Alat Tulis', amount: 450000, type: 'expense', category: 'Operasional', workflowStatus: 'pending_approval', source: 'Manual' },
];

const mockChartData = [
  { month: 'Apr', Pemasukan: 4000, Pengeluaran: 2400 },
  { month: 'Mei', Pemasukan: 3000, Pengeluaran: 1398 },
  { month: 'Jun', Pemasukan: 2000, Pengeluaran: 9800 },
  { month: 'Jul', Pemasukan: 2780, Pengeluaran: 3908 },
  { month: 'Agu', Pemasukan: 1890, Pengeluaran: 4800 },
  { month: 'Sep', Pemasukan: 2390, Pengeluaran: 3800 },
];

// --- REDUCER ---
function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'START_RECONCILE':
      return { ...state, isAutoReconciling: true };
    case 'FINISH_RECONCILE':
      return { ...state, isAutoReconciling: false, lastSync: new Date().toLocaleTimeString() };
    case 'ADD_WEBHOOK_EVENT':
      return {
        ...state,
        webhookEvents: [
          { id: crypto.randomUUID(), message: action.payload.message, timestamp: new Date().toLocaleTimeString() },
          ...state.webhookEvents
        ].slice(0, 5)
      };
    default:
      return state;
  }
}

// --- UTILS ---
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const getStatusConfig = (status: WorkflowStatus) => {
  const configs: Record<WorkflowStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    ingested: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-700/50', label: 'Teringest' },
    categorizing: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-900/30', label: 'AI Kategorisasi' },
    pending_approval: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-900/30', label: 'Menunggu Approval' },
    synced: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-900/30', label: 'Tersinkronisasi' },
    failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/30', label: 'Gagal' },
  };
  return configs[status];
};

// --- MAIN COMPONENT ---
export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [workflowState, dispatch] = useReducer(workflowReducer, {
    isAutoReconciling: false,
    lastSync: '08:00:00',
    webhookEvents: [
      { id: '1', message: 'Webhook received: Bank Mandiri mutation', timestamp: '07:55:12' }
    ]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const events = ['New mutation detected', 'Invoice paid via Gateway', 'Payroll batch processed'];
      const randomEvent = events[Math.floor(Math.random() * events.length)] ?? 'New mutation detected';
      dispatch({ type: 'ADD_WEBHOOK_EVENT', payload: { message: randomEvent } });

      setTransactions(prev => prev.map(tx => {
        if (tx.workflowStatus === 'ingested') return { ...tx, workflowStatus: 'categorizing' };
        if (tx.workflowStatus === 'categorizing') return { ...tx, workflowStatus: 'pending_approval' };
        if (tx.workflowStatus === 'pending_approval' && Math.random() > 0.7) return { ...tx, workflowStatus: 'synced' };
        return tx;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const financialSummary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const handleManualReconcile = () => {
    dispatch({ type: 'START_RECONCILE' });
    setTimeout(() => {
      setTransactions(prev => prev.map(tx =>
        tx.workflowStatus !== 'synced' ? { ...tx, workflowStatus: 'synced' } : tx
      ));
      dispatch({ type: 'FINISH_RECONCILE' });
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Rekapitulasi Keuangan</h1>
          <p className="text-slate-400 text-sm mt-1">Monitoring real-time dengan integrasi workflow otomatis</p>
        </div>
        <button
          onClick={handleManualReconcile}
          disabled={workflowState.isAutoReconciling}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          aria-label="Trigger rekonsiliasi otomatis"
        >
          <RefreshCw className={`w-4 h-4 ${workflowState.isAutoReconciling ? 'animate-spin' : ''}`} />
          {workflowState.isAutoReconciling ? 'Merekonsiliasi...' : 'Trigger Rekonsiliasi'}
        </button>
      </header>

      <section aria-label="Ringkasan Keuangan" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard title="Total Pemasukan" value={formatCurrency(financialSummary.income)} icon={TrendingUp} color="emerald" trend="+12.5%" />
        <SummaryCard title="Total Pengeluaran" value={formatCurrency(financialSummary.expense)} icon={TrendingDown} color="rose" trend="-4.2%" />
        <SummaryCard title="Saldo Bersih" value={formatCurrency(financialSummary.net)} icon={Wallet} color="indigo" trend="+8.1%" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-label="Grafik Arus Kas" className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tren Arus Kas (6 Bulan Terakhir)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                  formatter={(value: number) => formatCurrency(value * 1000)}
                />
                <Legend />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section aria-label="Monitor Workflow Otomatis" className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Webhook className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Workflow Engine</h2>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Status Sinkronisasi Ledger</span>
              <span className="text-xs text-emerald-400 font-mono">{workflowState.lastSync}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${workflowState.isAutoReconciling ? 'bg-indigo-500 animate-pulse w-full' : 'bg-emerald-500 w-full'}`}
                role="progressbar"
                aria-valuenow={100}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Live Webhook Events
          </h3>
          <div className="flex-1 overflow-y-auto max-h-48 space-y-2 pr-2" aria-live="polite">
            {workflowState.webhookEvents.map(event => (
              <div key={event.id} className="bg-slate-800/50 border border-slate-700 rounded p-2 text-xs">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="font-mono">{event.timestamp}</span>
                  <span className="text-indigo-400">200 OK</span>
                </div>
                <p className="text-slate-200">{event.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section aria-label="Daftar Transaksi" className="mt-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Mutasi & Status Workflow</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daftar transaksi keuangan beserta status pipeline otomatis</caption>
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Tanggal</th>
                <th scope="col" className="px-6 py-3 font-medium">Deskripsi</th>
                <th scope="col" className="px-6 py-3 font-medium">Kategori</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Jumlah</th>
                <th scope="col" className="px-6 py-3 font-medium">Sumber</th>
                <th scope="col" className="px-6 py-3 font-medium">Status Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.map((tx) => {
                const statusConfig = getStatusConfig(tx.workflowStatus);
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4 text-white font-medium">{tx.description}</td>
                    <td className="px-6 py-4 text-slate-400">{tx.category}</td>
                    <td className={`px-6 py-4 text-right font-mono whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <span className="flex items-center justify-end gap-1">
                        {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono">{tx.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className={`w-3 h-3 ${tx.workflowStatus === 'categorizing' ? 'animate-pulse' : ''}`} />
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

// --- SUB COMPONENTS ---
interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'emerald' | 'rose' | 'indigo';
  trend: string;
}

function SummaryCard({ title, value, icon: Icon, color, trend }: SummaryCardProps) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-900/20', text: 'text-emerald-400', border: 'border-emerald-800/50' },
    rose: { bg: 'bg-rose-900/20', text: 'text-rose-400', border: 'border-rose-800/50' },
    indigo: { bg: 'bg-indigo-900/20', text: 'text-indigo-400', border: 'border-indigo-800/50' },
  };

  const c = colorMap[color];

  return (
    <div className={`bg-slate-900 border ${c.border} rounded-xl p-6 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${c.bg} rounded-full blur-2xl opacity-50 -translate-y-8 translate-x-8`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-400 text-sm font-medium">{title}</span>
          <div className={`p-2 rounded-lg ${c.bg}`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className={`text-xs font-medium ${c.text}`}>
          {trend} dari bulan lalu
        </p>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useReducer, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, RefreshCw, CheckCircle2,
  AlertCircle, Clock, Zap, ArrowUpRight, ArrowDownRight,
  Webhook, FileText, LogOut, PlusCircle, DollarSign, Settings2, Trash2, Tags, Plus, X
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

const defaultIncomeCategories = ['Penjualan', 'Jasa', 'Investasi', 'Lainnya'];
const defaultExpenseCategories = ['Operasional', 'Infrastruktur', 'Gaji', 'Pemasaran', 'Lainnya'];

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

interface FinanceDashboardProps {
  onLogout: () => void;
}

// --- MAIN COMPONENT ---
export default function FinanceDashboard({ onLogout }: FinanceDashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const storedTransactions = localStorage.getItem('financeTransactions');
    if (!storedTransactions) return initialTransactions;

    try {
      return JSON.parse(storedTransactions) as Transaction[];
    } catch {
      return initialTransactions;
    }
  });
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState(defaultIncomeCategories);
  const [expenseCategories, setExpenseCategories] = useState(defaultExpenseCategories);
  const [workflowState, dispatch] = useReducer(workflowReducer, {
    isAutoReconciling: false,
    lastSync: '08:00:00',
    webhookEvents: [
      { id: '1', message: 'Webhook received: Bank Mandiri mutation', timestamp: '07:55:12' }
    ]
  });

  useEffect(() => {
    localStorage.setItem('financeTransactions', JSON.stringify(transactions));
  }, [transactions]);

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

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id' | 'workflowStatus' | 'source'>) => {
    setTransactions(prev => [{
      ...transactionData,
      id: crypto.randomUUID(),
      workflowStatus: 'synced',
      source: 'Manual',
    }, ...prev]);
  };

  const handleAddCategory = (type: TransactionType, category: string) => {
    const cleanCategory = category.trim();
    if (!cleanCategory) return;

    if (type === 'income') {
      setIncomeCategories(prev => prev.includes(cleanCategory) ? prev : [...prev, cleanCategory]);
    } else {
      setExpenseCategories(prev => prev.includes(cleanCategory) ? prev : [...prev, cleanCategory]);
    }
  };

  const handleRemoveCategory = (type: TransactionType, category: string) => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    if (categories.length <= 1) return;

    if (type === 'income') {
      setIncomeCategories(prev => prev.filter(item => item !== category));
    } else {
      setExpenseCategories(prev => prev.filter(item => item !== category));
    }
  };

  const handleClearTransactions = () => {
    if (transactions.length > 0 && window.confirm('Hapus semua data pemasukan dan pengeluaran?')) {
      setTransactions([]);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Rekapitulasi Keuangan</h1>
          <p className="text-slate-400 text-sm mt-1">Monitoring real-time dengan integrasi workflow otomatis</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleManualReconcile}
            disabled={workflowState.isAutoReconciling}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="Trigger rekonsiliasi otomatis"
          >
            <RefreshCw className={`w-4 h-4 ${workflowState.isAutoReconciling ? 'animate-spin' : ''}`} />
            {workflowState.isAutoReconciling ? 'Merekonsiliasi...' : 'Trigger Rekonsiliasi'}
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-600">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <section aria-label="Ringkasan Keuangan" className="mb-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-400">Ringkasan hari ini</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Kondisi keuangan Anda</h2>
          </div>
          <span className="hidden text-sm text-slate-500 sm:block">Data diperbarui secara langsung</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard title="Total Pemasukan" value={formatCurrency(financialSummary.income)} icon={TrendingUp} color="emerald" trend="+12.5%" />
          <SummaryCard title="Total Pengeluaran" value={formatCurrency(financialSummary.expense)} icon={TrendingDown} color="rose" trend="-4.2%" />
          <SummaryCard title="Saldo Bersih" value={formatCurrency(financialSummary.net)} icon={Wallet} color="indigo" trend="+8.1%" />
        </div>
      </section>

      <section aria-label="Input transaksi" className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div>
          <h2 className="font-semibold text-white">Catat transaksi</h2>
          <p className="mt-1 text-sm text-slate-400">Tambahkan pemasukan atau pengeluaran baru.</p>
        </div>
        <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowIncomeForm(true)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white transition-colors hover:bg-emerald-500">
          <PlusCircle className="h-5 w-5" />
          Tambah Pemasukan
        </button>
        <button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-3 font-medium text-white transition-colors hover:bg-rose-500">
          <DollarSign className="h-5 w-5" />
          Tambah Pengeluaran
        </button>
        </div>
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

      <AdminPanel
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
        onClearTransactions={handleClearTransactions}
      />

      {showIncomeForm && <TransactionForm type="income" categories={incomeCategories} onAddTransaction={handleAddTransaction} onClose={() => setShowIncomeForm(false)} />}
      {showExpenseForm && <TransactionForm type="expense" categories={expenseCategories} onAddTransaction={handleAddTransaction} onClose={() => setShowExpenseForm(false)} />}
    </main>
  );
}

interface TransactionFormProps {
  type: TransactionType;
  categories: string[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'workflowStatus' | 'source'>) => void;
  onClose: () => void;
}

function TransactionForm({ type, categories, onAddTransaction, onClose }: TransactionFormProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(type === 'income' ? 'Penjualan' : 'Operasional');
  const isIncome = type === 'income';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAddTransaction({ date, description, amount: Number(amount), type, category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{isIncome ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}</h2>
          <button type="button" onClick={onClose} className="text-2xl text-slate-400 hover:text-white" aria-label="Tutup form">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={`${type}-date`} className="mb-2 block text-sm text-slate-300">Tanggal</label>
            <input id={`${type}-date`} type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white" />
          </div>
          <div>
            <label htmlFor={`${type}-description`} className="mb-2 block text-sm text-slate-300">Deskripsi</label>
            <input id={`${type}-description`} type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Contoh: Penjualan Produk A" required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white" />
          </div>
          <div>
            <label htmlFor={`${type}-amount`} className="mb-2 block text-sm text-slate-300">Jumlah (Rp)</label>
            <input id={`${type}-amount`} type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white" />
          </div>
          <div>
            <label htmlFor={`${type}-category`} className="mb-2 block text-sm text-slate-300">Kategori</label>
            <select id={`${type}-category`} value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white">
              {categories.map(option => <option key={option}>{option}</option>)}
            </select>
          </div>
          <button type="submit" className={`w-full rounded-lg px-4 py-3 font-medium text-white ${isIncome ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
            Simpan {isIncome ? 'Pemasukan' : 'Pengeluaran'}
          </button>
        </form>
      </section>
    </div>
  );
}

interface AdminPanelProps {
  incomeCategories: string[];
  expenseCategories: string[];
  onAddCategory: (type: TransactionType, category: string) => void;
  onRemoveCategory: (type: TransactionType, category: string) => void;
  onClearTransactions: () => void;
}

function AdminPanel({ incomeCategories, expenseCategories, onAddCategory, onRemoveCategory, onClearTransactions }: AdminPanelProps) {
  const [categoryType, setCategoryType] = useState<TransactionType>('income');
  const [categoryName, setCategoryName] = useState('');
  const categories = categoryType === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAddCategory(categoryType, categoryName);
    setCategoryName('');
  };

  return (
    <section aria-label="Panel admin" className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-900/40 p-2 text-indigo-400"><Settings2 className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-semibold text-white">Panel Admin</h2>
            <p className="mt-1 text-sm text-slate-400">Kelola kategori dan data transaksi dashboard.</p>
          </div>
        </div>
        <button onClick={onClearTransactions} type="button" className="flex items-center justify-center gap-2 rounded-lg border border-red-900/70 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-900/50">
          <Trash2 className="h-4 w-4" />
          Hapus Semua Transaksi
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-200"><Tags className="h-4 w-4 text-indigo-400" /> Kelola Kategori</div>
          <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 sm:flex-row">
            <select value={categoryType} onChange={(event) => setCategoryType(event.target.value as TransactionType)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
            <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Nama kategori baru" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
            <button type="submit" className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"><Plus className="h-4 w-4" />Tambah</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <span key={category} className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300">
                {category}
                <button type="button" onClick={() => onRemoveCategory(categoryType, category)} aria-label={`Hapus kategori ${category}`} className="text-slate-500 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 p-4 text-sm text-slate-300">
          <p className="font-medium text-amber-300">Perhatian Admin</p>
          <p className="mt-2 leading-6 text-slate-400">Menghapus semua transaksi akan mengosongkan total pemasukan, pengeluaran, dan saldo bersih. Tindakan ini tidak dapat dibatalkan.</p>
        </div>
      </div>
    </section>
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

/*
import React, { useState, useEffect, useReducer, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, RefreshCw, CheckCircle2,
  AlertCircle, Clock, Zap, ArrowUpRight, ArrowDownRight,
  Webhook, FileText, LogOut, PlusCircle, DollarSign
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

// --- LOGIN COMPONENT ---
interface LoginPageProps {
  onLogin: () => void;
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate authentication
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('isLoggedIn', 'true');
        onLogin();
      } else {
        setError('Username atau password salah!');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Login Admin</h1>
          <p className="text-slate-400 text-sm mt-2">Masuk untuk mengelola keuangan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Default: username: <code className="bg-slate-800 px-2 py-1 rounded">admin</code>, password: <code className="bg-slate-800 px-2 py-1 rounded">admin123</code></p>
        </div>
      </div>
    </div>
  );
}

// --- INCOME FORM COMPONENT ---
interface IncomeFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'workflowStatus' | 'source'>) => void;
  onClose: () => void;
}

function IncomeForm({ onAddTransaction, onClose }: IncomeFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Penjualan');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction({
      date,
      description,
      amount: parseFloat(amount),
      type: 'income',
      category,
    } as Omit<Transaction, 'id' | 'workflowStatus' | 'source'>);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            Tambah Pemasukan
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Contoh: Penjualan Produk A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Jumlah (Rp)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Penjualan">Penjualan</option>
              <option value="Jasa">Jasa</option>
              <option value="Investasi">Investasi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Simpan Pemasukan
          </button>
        </form>
      </div>
    </div>
  );
}

// --- EXPENSE FORM COMPONENT ---
interface ExpenseFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'workflowStatus' | 'source'>) => void;
  onClose: () => void;
}

function ExpenseForm({ onAddTransaction, onClose }: ExpenseFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Operasional');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction({
      date,
      description,
      amount: parseFloat(amount),
      type: 'expense',
      category,
    } as Omit<Transaction, 'id' | 'workflowStatus' | 'source'>);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
            Tambah Pengeluaran
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Contoh: Pembelian Alat Tulis"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Jumlah (Rp)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Operasional">Operasional</option>
              <option value="Infrastruktur">Infrastruktur</option>
              <option value="Gaji">Gaji</option>
              <option value="Pemasaran">Pemasaran</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-500 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Simpan Pengeluaran
          </button>
        </form>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function FinanceDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id' | 'workflowStatus' | 'source'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      workflowStatus: 'synced',
      source: 'Manual',
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Rekapitulasi Keuangan</h1>
          <p className="text-slate-400 text-sm mt-1">Monitoring real-time dengan integrasi workflow otomatis</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleManualReconcile}
            disabled={workflowState.isAutoReconciling}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="Trigger rekonsiliasi otomatis"
          >
            <RefreshCw className={`w-4 h-4 ${workflowState.isAutoReconciling ? 'animate-spin' : ''}`} />
            {workflowState.isAutoReconciling ? 'Merekonsiliasi...' : 'Trigger Rekonsiliasi'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      // Tombol Tambah Transaksi
      <section className="mb-8 flex flex-wrap gap-4">
        <button
          onClick={() => setShowIncomeForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Tambah Pemasukan
        </button>
        <button
          onClick={() => setShowExpenseForm(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <DollarSign className="w-5 h-5" />
          Tambah Pengeluaran
        </button>
      </section>

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

      // Modal Form Pemasukan
      {showIncomeForm && (
        <IncomeForm
          onAddTransaction={handleAddTransaction}
          onClose={() => setShowIncomeForm(false)}
        />
      )}

      // Modal Form Pengeluaran
      {showExpenseForm && (
        <ExpenseForm
          onAddTransaction={handleAddTransaction}
          onClose={() => setShowExpenseForm(false)}
        />
      )}
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
*/
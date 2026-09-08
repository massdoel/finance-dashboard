import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Clock3, Eye, FileText, TrendingDown, TrendingUp, Wallet, XCircle, Zap } from 'lucide-react';

interface PublicOverviewProps {
  onAdminLogin: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

interface StoredTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  workflowStatus: 'ingested' | 'categorizing' | 'pending_approval' | 'synced' | 'failed';
  source: string;
}

const fallbackTransactions: StoredTransaction[] = [
  { id: '1', date: '2026-09-01', description: 'Penjualan Produk A', amount: 15000000, type: 'income', category: 'Penjualan', workflowStatus: 'synced', source: 'Bank API' },
  { id: '2', date: '2026-09-02', description: 'Langganan AWS', amount: 2500000, type: 'expense', category: 'Infrastruktur', workflowStatus: 'synced', source: 'Webhook' },
  { id: '3', date: '2026-09-05', description: 'Transfer Klien XYZ', amount: 8500000, type: 'income', category: 'Jasa', workflowStatus: 'categorizing', source: 'Bank API' },
  { id: '4', date: '2026-09-06', description: 'Pembelian Alat Tulis', amount: 450000, type: 'expense', category: 'Operasional', workflowStatus: 'pending_approval', source: 'Manual' },
];

function getPublicTransactions() {
  const storedTransactions = localStorage.getItem('financeTransactions');
  if (!storedTransactions) return fallbackTransactions;

  try {
    return JSON.parse(storedTransactions) as StoredTransaction[];
  } catch {
    return fallbackTransactions;
  }
}

function getPublicSummary() {
  const transactions = getPublicTransactions();
  if (!transactions.length) return { income: 0, expense: 0, balance: 0 };
  const income = transactions.filter(transaction => transaction.type === 'income').reduce((total, transaction) => total + transaction.amount, 0);
  const expense = transactions.filter(transaction => transaction.type === 'expense').reduce((total, transaction) => total + transaction.amount, 0);
  return { income, expense, balance: income - expense };
}

export default function PublicOverview({ onAdminLogin }: PublicOverviewProps) {
  const publicSummary = getPublicSummary();
  const publicTransactions = getPublicTransactions();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-400">
              <Eye className="h-4 w-4" />
              Ringkasan Publik
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">Kondisi Keuangan</h1>
            <p className="mt-3 max-w-xl text-slate-400">Lihat total pemasukan, pengeluaran, dan saldo bersih secara langsung.</p>
          </div>
          <button onClick={onAdminLogin} className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 font-medium text-slate-200 transition-colors hover:border-indigo-500 hover:text-white">
            Masuk Admin
            <ArrowRight className="h-4 w-4" />
          </button>
        </header>

        <section aria-label="Statistik keuangan publik" className="grid gap-5 md:grid-cols-3">
          <PublicStatCard label="Total Pendapatan" value={formatCurrency(publicSummary.income)} detail="Akumulasi pemasukan" icon={TrendingUp} color="emerald" />
          <PublicStatCard label="Total Pengeluaran" value={formatCurrency(publicSummary.expense)} detail="Akumulasi pengeluaran" icon={TrendingDown} color="rose" />
          <PublicStatCard label="Saldo Bersih" value={formatCurrency(publicSummary.balance)} detail="Pendapatan dikurangi pengeluaran" icon={Wallet} color="indigo" />
        </section>

        <section aria-label="Mutasi dan status workflow publik" className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-800 p-5 md:p-6">
            <div className="rounded-lg bg-indigo-900/40 p-2 text-indigo-400"><FileText className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Mutasi &amp; Status Workflow</h2>
              <p className="mt-1 text-sm text-slate-400">Daftar transaksi dan progres pemrosesannya.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Mutasi keuangan dan status workflow</caption>
              <thead className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Deskripsi</th>
                  <th className="px-5 py-3 font-medium">Kategori</th>
                  <th className="px-5 py-3 text-right font-medium">Jumlah</th>
                  <th className="px-5 py-3 font-medium">Sumber</th>
                  <th className="px-5 py-3 font-medium">Status Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {publicTransactions.map(transaction => <PublicTransactionRow key={transaction.id} transaction={transaction} />)}
              </tbody>
            </table>
          </div>
          {!publicTransactions.length && <p className="p-8 text-center text-sm text-slate-500">Belum ada data mutasi.</p>}
        </section>

        <p className="mt-8 text-center text-xs text-slate-500">Data publik menampilkan ringkasan dan status mutasi. Pengelolaan transaksi tersedia untuk admin.</p>
      </div>
    </main>
  );
}

function PublicTransactionRow({ transaction }: { transaction: StoredTransaction }) {
  const status = {
    ingested: { label: 'Teringest', icon: Clock3, color: 'text-slate-400', bg: 'bg-slate-700/50' },
    categorizing: { label: 'AI Kategorisasi', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-900/30' },
    pending_approval: { label: 'Menunggu Approval', icon: Clock3, color: 'text-amber-400', bg: 'bg-amber-900/30' },
    synced: { label: 'Tersinkronisasi', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
    failed: { label: 'Gagal', icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/30' },
  }[transaction.workflowStatus];
  const StatusIcon = status.icon;

  return (
    <tr className="transition-colors hover:bg-slate-800/30">
      <td className="whitespace-nowrap px-5 py-4 text-slate-300">{transaction.date}</td>
      <td className="px-5 py-4 font-medium text-white">{transaction.description}</td>
      <td className="px-5 py-4 text-slate-400">{transaction.category}</td>
      <td className={`whitespace-nowrap px-5 py-4 text-right font-mono ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
        <span className="flex items-center justify-end gap-1">
          {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {formatCurrency(transaction.amount)}
        </span>
      </td>
      <td className="px-5 py-4"><span className="rounded bg-slate-800 px-2 py-1 text-xs font-mono text-slate-300">{transaction.source}</span></td>
      <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.color}`}><StatusIcon className="h-3 w-3" />{status.label}</span></td>
    </tr>
  );
}

interface PublicStatCardProps {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  color: 'emerald' | 'rose' | 'indigo';
}

function PublicStatCard({ label, value, detail, icon: Icon, color }: PublicStatCardProps) {
  const styles = {
    emerald: { border: 'border-emerald-900/70', icon: 'bg-emerald-900/40 text-emerald-400', value: 'text-emerald-300' },
    rose: { border: 'border-rose-900/70', icon: 'bg-rose-900/40 text-rose-400', value: 'text-rose-300' },
    indigo: { border: 'border-indigo-900/70', icon: 'bg-indigo-900/40 text-indigo-400', value: 'text-indigo-300' },
  }[color];

  return (
    <article className={`rounded-xl border bg-slate-900 p-6 ${styles.border}`}>
      <div className="mb-8 flex items-start justify-between">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className={`rounded-lg p-2 ${styles.icon}`}><Icon className="h-5 w-5" /></span>
      </div>
      <p className={`break-words text-2xl font-bold md:text-3xl ${styles.value}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

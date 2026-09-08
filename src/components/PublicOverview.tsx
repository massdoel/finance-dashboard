import { ArrowRight, Eye, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

interface PublicOverviewProps {
  onAdminLogin: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

interface StoredTransaction {
  amount: number;
  type: 'income' | 'expense';
}

function getPublicSummary() {
  const fallback = { income: 23500000, expense: 2950000, balance: 20550000 };
  const storedTransactions = localStorage.getItem('financeTransactions');
  if (!storedTransactions) return fallback;

  try {
    const transactions = JSON.parse(storedTransactions) as StoredTransaction[];
    const income = transactions.filter(transaction => transaction.type === 'income').reduce((total, transaction) => total + transaction.amount, 0);
    const expense = transactions.filter(transaction => transaction.type === 'expense').reduce((total, transaction) => total + transaction.amount, 0);
    return { income, expense, balance: income - expense };
  } catch {
    return fallback;
  }
}

export default function PublicOverview({ onAdminLogin }: PublicOverviewProps) {
  const publicSummary = getPublicSummary();

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

        <p className="mt-8 text-center text-xs text-slate-500">Data publik hanya menampilkan total. Detail transaksi tersedia untuk admin.</p>
      </div>
    </main>
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

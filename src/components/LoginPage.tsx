import { FormEvent, useState } from 'react';
import { LockKeyhole, Wallet } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username === 'admin' && password === 'abdullahjiddan123') {
      localStorage.setItem('isLoggedIn', 'true');
      setError('');
      onLogin();
      return;
    }

    setError('Username atau password admin salah.');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-900/40">
            <Wallet className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Login Admin</h1>
          <p className="mt-2 text-sm text-slate-400">Akses dashboard keuangan internal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-300">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && <p className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">{error}</p>}

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <LockKeyhole className="h-4 w-4" />
            Masuk sebagai Admin
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">MFI Solusi Keungan Untuk anda</p>
      </section>
    </main>
  );
}

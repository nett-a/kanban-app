import { useState } from 'react';
import { Logo } from '../components/ui/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_USERS = [
  { username: 'alice', name: 'Alice Johnson', color: 'bg-amber-400 text-amber-950' },
  { username: 'bob', name: 'Bob Smith', color: 'bg-blue-500 text-white' },
  { username: 'charlie', name: 'Charlie Davis', color: 'bg-pink-400 text-pink-950' },
  { username: 'diana', name: 'Diana Prince', color: 'bg-teal-500 text-white' },
  { username: 'evan', name: 'Evan Wright', color: 'bg-violet-500 text-white' },
];
const DEMO_PASSWORD = 'password123';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (u) => {
    setUsername(u);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-linear-to-br from-blue-600 via-cyan-400 to-pink-300 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo className="text-2xl" />
          <p className="text-sm text-slate-500">Log in to continue to your team boards</p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="username"
              className="input"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alice"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting || !username || !password}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="mt-8">
          <p className="mb-3 text-center text-xs text-slate-500">
            <span className="font-semibold tracking-wide uppercase">Demo accounts</span> · password <code className="rounded bg-slate-100 px-1">{DEMO_PASSWORD}</code>
          </p>
          <div className="grid grid-cols-5 gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                type="button"
                onClick={() => fillDemo(u.username)}
                className="flex flex-col items-center gap-1 rounded-lg p-2 text-xs text-slate-600 hover:bg-slate-100"
                aria-label={`Use demo account ${u.username}`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full font-semibold ${u.color}`}>
                  {u.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                {u.username}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

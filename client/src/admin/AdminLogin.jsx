import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLogin() {
  const { login, isAuthenticated, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!authLoading && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/admin'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-1.5 font-display font-bold text-xl text-white justify-center mb-8">
          <Zap className="w-5 h-5 text-volt" fill="currentColor" />
          Voltra Admin
        </div>

        <form onSubmit={handleSubmit} className="bg-panel rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit"
            />
          </div>
          {error && <p className="text-sm text-stock-out">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-volt text-white px-6 py-3 font-medium hover:bg-volt-dim transition-colors disabled:opacity-70"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Log in
          </button>
        </form>
        <p className="text-center text-xs text-white/40 mt-4">
          First time? Run <code className="text-white/60">npm run seed</code> in the server to create a login.
        </p>
      </div>
    </div>
  );
}

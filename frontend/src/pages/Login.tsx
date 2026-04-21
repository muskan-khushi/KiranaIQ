import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Activity, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { login } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export default function Login() {
  const navigate = useNavigate();
  const { setToken } = useAuthStore();
  const [email, setEmail] = useState('demo@kiranaiq.in');
  const [password, setPassword] = useState('demo1234');
  const [showPw, setShowPw] = useState(false);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setToken(data.access_token, email);
      navigate('/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Card */}
        <div className="card p-8 shadow-elevated">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-glow-accent">
              <Activity size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-primary">
                Kirana<span className="text-accent">IQ</span>
              </span>
              <p className="text-[10px] text-muted font-medium tracking-wide uppercase">NBFC Underwriting Portal</p>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-primary mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-7">Sign in to your officer account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="officer@nbfc.com"
                required
                className="w-full px-4 py-3 text-sm bg-surface-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all text-primary placeholder:text-muted"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 text-sm bg-surface-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all text-primary placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 text-xs text-danger bg-danger-light border border-danger/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} />
                {(mutation.error as any)?.response?.data?.detail ?? 'Login failed. Check credentials.'}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-dark transition-all shadow-glow-accent disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {mutation.isPending ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-muted text-center mb-2">Demo credentials pre-filled above</p>
            <a
              href="/results?demo=1"
              className="block text-center text-xs text-accent hover:underline font-medium"
            >
              Or view demo results without login →
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          KiranaIQ · Remote Credit Underwriting · v1.0
        </p>
      </div>
    </div>
  );
}
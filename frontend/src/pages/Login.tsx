import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, AlertCircle, Loader2, Zap, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-primary p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent opacity-[0.07]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-accent opacity-[0.05] -translate-x-1/2 translate-y-1/2" />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">
              Kirana<span className="text-accent">IQ</span>
            </span>
          </div>
        </div>

        <div className="relative">
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-4">NBFC Underwriting Platform</p>
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-6">
            Credit decisions<br />
            in <span className="text-accent">90 seconds.</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Upload store photos. Our AI pipeline analyses shelf density, geo footfall, and fraud signals to generate a full credit report.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'No ITR or GST history required',
              'Vision AI + OSM geo-intelligence',
              'FOIR-compliant loan sizing',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-white/60 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-[11px]">
          KiranaIQ · AI-Powered Kirana Credit Assessment · v1.0
        </p>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-lg text-primary tracking-tight">
              Kirana<span className="text-accent">IQ</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold text-primary mb-1 tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted mb-8">Sign in to your officer account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-secondary mb-1.5 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="officer@nbfc.com"
                required
                className="w-full px-4 py-3 text-sm bg-surface-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all text-primary placeholder:text-muted"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-secondary mb-1.5 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 text-sm bg-surface-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all text-primary placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 text-[12px] text-danger bg-danger-light border border-danger/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={13} />
                {(mutation.error as any)?.response?.data?.detail ?? 'Login failed. Check credentials.'}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent-dark transition-all shadow-glow-accent disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <> Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border space-y-3">
            <p className="text-[11px] text-muted text-center">Demo credentials pre-filled above</p>
            <a
              href="/results?demo=1"
              className="block text-center text-[12px] text-accent hover:underline font-medium"
            >
              Or view demo results without login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
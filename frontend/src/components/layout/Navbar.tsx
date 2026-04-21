import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, BarChart2, LogOut, Menu, X, Cpu, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const NAV_ITEMS = [
  { to: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/new-assessment', label: 'New Assessment',  icon: PlusCircle },
  { to: '/analytics',      label: 'Analytics',       icon: BarChart2 },
  { to: '/how-it-works',   label: 'How it works',    icon: Cpu },
];

export default function Navbar() {
  const location = useLocation();
  const { email, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-surface/96 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[60px]">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-glow-accent group-hover:scale-105 transition-transform">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-[18px] tracking-tight text-primary">
              Kirana<span className="text-accent">IQ</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-accent-light text-accent'
                      : 'text-muted hover:bg-surface-2 hover:text-primary'
                  }`}
                >
                  <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right: email + logout */}
          <div className="flex items-center gap-2">
            {email && (
              <span className="hidden lg:block text-[11px] text-muted font-mono bg-surface-2 px-2.5 py-1 rounded-lg border border-border">
                {email}
              </span>
            )}
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 text-[13px] text-muted hover:text-danger transition-colors px-2.5 py-2 rounded-xl hover:bg-danger-light"
            >
              <LogOut size={14} />
              Logout
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-secondary hover:bg-surface-2 transition-all"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-border bg-surface animate-fade-in">
          <div className="px-4 py-3 space-y-0.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                    active ? 'bg-accent-light text-accent' : 'text-secondary hover:bg-surface-2 hover:text-primary'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
            <div className="border-t border-border pt-2 mt-2">
              {email && <p className="text-[11px] text-muted font-mono px-3 py-1.5">{email}</p>}
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-danger hover:bg-danger-light transition-all w-full"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
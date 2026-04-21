import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, PlusCircle, BarChart2, LogOut, Menu, X, Cpu } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

export default function Navbar() {
  const location = useLocation();
  const { email, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/new-assessment', label: 'New Assessment',  icon: PlusCircle },
    { to: '/analytics',      label: 'Analytics',        icon: BarChart2 },
    { to: '/how-it-works',   label: 'How it works',     icon: Cpu },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-glow-accent group-hover:scale-105 transition-transform">
              <Activity size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl text-primary tracking-tight">
              Kirana<span className="text-accent">IQ</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-accent/10 text-accent'
                      : 'text-secondary hover:bg-surface-2 hover:text-primary'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden md:block text-xs text-muted font-mono bg-surface-2 px-2.5 py-1 rounded-md border border-border">
                {email}
              </span>
            )}
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted hover:text-danger transition-colors px-2 py-1.5 rounded-lg hover:bg-danger-light"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-secondary hover:bg-surface-2 hover:text-primary transition-all"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-surface/98 backdrop-blur-md animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ? 'bg-accent/10 text-accent' : 'text-secondary hover:bg-surface-2 hover:text-primary'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
            <div className="border-t border-border pt-2 mt-2">
              {email && <p className="text-xs text-muted font-mono px-3 py-1.5">{email}</p>}
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger-light transition-all w-full"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
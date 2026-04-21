import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

export default function Navbar() {
  const location = useLocation();
  const { email, logout } = useAuthStore();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/new-assessment', label: 'New Assessment', icon: PlusCircle },
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
            <span className="font-display font-700 text-xl text-primary tracking-tight">
              Kirana<span className="text-accent">IQ</span>
            </span>
          </Link>

          {/* Nav links */}
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
                  <Icon size={16} />
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
              className="flex items-center gap-1.5 text-sm text-muted hover:text-danger transition-colors px-2 py-1.5 rounded-lg hover:bg-danger-light"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
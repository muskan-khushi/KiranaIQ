import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewAssessment from './pages/NewAssessment';
import AssessmentResultPage from './pages/AssessmentResult';
import Analytics from './pages/Analytics';
import HowItWorks from './pages/HowItWorks';
import { useAuthStore } from './store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  );
}

// KEY FIX: AdaptiveLayout renders full Navbar for authenticated users,
// minimal nav for unauthenticated visitors. This is what was missing —
// /how-it-works was only in PublicLayout so authenticated users lost
// the Navbar when navigating there.
function AdaptiveLayout() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated()) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Outlet />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg tracking-tight">
            Kirana<span className="text-accent">IQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/how-it-works" className="text-sm text-muted hover:text-primary transition-colors hidden sm:block">
              How it works
            </Link>
            <Link to="/login" className="text-sm text-accent hover:underline font-medium">
              Sign In →
            </Link>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Adaptive: full Navbar for auth, minimal nav for visitors */}
          <Route element={<AdaptiveLayout />}>
            <Route path="/results" element={<AssessmentResultPage />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
          </Route>

          {/* Protected: always full Navbar */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-assessment" element={<NewAssessment />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/assessment/:id" element={<AssessmentResultPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
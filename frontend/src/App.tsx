import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
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

// Public nav wrapper (for results & how-it-works pages accessible without login)
function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-display font-bold text-lg">
            Kirana<span className="text-accent">IQ</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/how-it-works" className="text-sm text-muted hover:text-primary transition-colors hidden sm:block">
              How it works
            </a>
            <a href="/login" className="text-sm text-accent hover:underline font-medium">
              Sign In →
            </a>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Public pages with minimal nav */}
          <Route element={<PublicLayout />}>
            <Route path="/results" element={<AssessmentResultPage />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-assessment" element={<NewAssessment />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/results" element={<AssessmentResultPage />} />
            <Route path="/assessment/:id" element={<AssessmentResultPage />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
          </Route>

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
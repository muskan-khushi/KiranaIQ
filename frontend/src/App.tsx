import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewAssessment from './pages/NewAssessment';
import AssessmentResult from './components/results/AssessmentResult';
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

function PublicLayout() {
  return <Outlet />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Demo results - accessible without login */}
          <Route
            path="/results"
            element={
              <div className="min-h-screen bg-background">
                <div className="border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-50">
                  <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 font-display font-bold text-lg">
                      Kirana<span className="text-accent">IQ</span>
                    </a>
                    <a href="/login" className="text-sm text-accent hover:underline font-medium">Sign In →</a>
                  </div>
                </div>
                <AssessmentResult />
              </div>
            }
          />

          {/* Protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-assessment" element={<NewAssessment />} />
            <Route path="/assessment/:id" element={<AssessmentResult />} />
          </Route>

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
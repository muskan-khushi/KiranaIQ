import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AssessmentForm from './components/assessment/AssessmentForm';
import AssessmentResult from './components/results/AssessmentResult';

// A simple layout wrapper to give it a clean app-like feel
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Aesthetic Top Navbar */}
      <nav className="bg-surface border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-surface font-bold text-xl">
              K
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">KiranaIQ</span>
          </div>
          <div className="flex gap-4 text-sm font-medium text-muted">
            <span className="hover:text-primary cursor-pointer transition-colors">Dashboard</span>
            <span className="text-primary cursor-pointer">New Assessment</span>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Default route goes to the submission form */}
          <Route path="/" element={<Navigate to="/new-assessment" replace />} />
          
          {/* The Data Entry Page */}
          <Route path="/new-assessment" element={<AssessmentForm />} />
          
          {/* The Final Dashboard */}
          <Route path="/results" element={<AssessmentResult />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
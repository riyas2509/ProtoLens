import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { SharePage } from './pages/SharePage';
import { AuthPage } from './pages/AuthPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <div className="h-8 w-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/share/:id" element={<SharePage />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <PrivateRoute>
                <HistoryPage />
              </PrivateRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

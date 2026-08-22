import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import DashboardPlaceholder from './pages/DashboardPlaceholder';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* State B: Authenticated but might not have workspace -> /onboarding */}
        <Route element={<ProtectedRoute requireWorkspace={false} />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>
        
        {/* State C: Authenticated WITH workspace -> /dashboard */}
        <Route element={<ProtectedRoute requireWorkspace={true} />}>
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
        </Route>

        {/* Redirect root to login, ProtectedRoute will handle redirecting to dashboard/onboarding if logged in */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

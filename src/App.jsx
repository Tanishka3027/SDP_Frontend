import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import PoliticianDashboard from './pages/PoliticianDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';

const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading CivicConnect...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<DashboardRouter />} />
          <Route path="/citizen" element={
            <RoleRoute roles={['citizen']}>
              <CitizenDashboard />
            </RoleRoute>
          } />
          <Route path="/politician" element={
            <RoleRoute roles={['politician']}>
              <PoliticianDashboard />
            </RoleRoute>
          } />
          <Route path="/admin" element={
            <RoleRoute roles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          } />
          <Route path="/moderator" element={
            <RoleRoute roles={['moderator']}>
              <ModeratorDashboard />
            </RoleRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

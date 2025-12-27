import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Gallery from './pages/Gallery';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectWizard from './pages/ProjectWizard';
import ProjectView from './pages/ProjectView';
import ProjectProgress from './pages/ProjectProgress';
import ProjectReview from './pages/ProjectReview';
import Characters from './pages/Characters';
import CharacterForm from './pages/CharacterForm';
import Settings from './pages/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';

// Error Pages
import NotFound from './pages/NotFound';

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    // Pass the current location as state so login can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public Routes - Dashboard is the landing page (redirects to login if not authenticated) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/gallery" element={<Gallery />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/new" element={<ProjectWizard />} />
        <Route path="projects/:id" element={<ProjectView />} />
        <Route path="projects/:id/edit" element={<ProjectWizard />} />
        <Route path="projects/:id/progress" element={<ProjectProgress />} />
        <Route path="projects/:id/review" element={<ProjectReview />} />
        <Route path="characters" element={<Characters />} />
        <Route path="characters/new" element={<CharacterForm />} />
        <Route path="characters/:id" element={<CharacterForm />} />
        <Route path="settings" element={<Settings />} />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users/:id"
          element={
            <ProtectedRoute adminOnly>
              <AdminUserDetail />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

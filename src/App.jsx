import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import BuildsPage from './pages/builds/BuildsPage';
import BuildDetailPage from './pages/builds/BuildDetailPage';
import BuildCreatePage from './pages/builds/BuildCreatePage';
import BuildEditPage from './pages/builds/BuildEditPage';
import RequestsPage from './pages/requests/RequestsPage';
import RequestDetailPage from './pages/requests/RequestDetailPage';
import ShowcasePage from './pages/showcase/ShowcasePage';
import ShowcaseDetailPage from './pages/showcase/ShowcaseDetailPage';
import ProfilePage from './pages/profile/ProfilePage';
import ProfileEditPage from './pages/profile/ProfileEditPage';
import BuilderApplyPage from './pages/builder/BuilderApplyPage';
import BuilderDashboardPage from './pages/builder/BuilderDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPartsPage from './pages/admin/AdminPartsPage';
import AdminPartNewPage from './pages/admin/AdminPartNewPage';
import AdminPartEditPage from './pages/admin/AdminPartEditPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';
import AdminRulesPage from './pages/admin/AdminRulesPage';

import './App.css';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/builds" element={<BuildsPage />} />
        <Route path="/builds/:id" element={<BuildDetailPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/showcase/:id" element={<ShowcaseDetailPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />

        {/* Authenticated routes */}
        <Route path="/builds/new" element={
          <ProtectedRoute><BuildCreatePage /></ProtectedRoute>
        } />
        <Route path="/builds/:id/edit" element={
          <ProtectedRoute><BuildEditPage /></ProtectedRoute>
        } />
        <Route path="/profile/edit" element={
          <ProtectedRoute><ProfileEditPage /></ProtectedRoute>
        } />
        <Route path="/builder/apply" element={
          <ProtectedRoute><BuilderApplyPage /></ProtectedRoute>
        } />

        {/* Builder routes */}
        <Route path="/builder/dashboard" element={
          <ProtectedRoute requiredRole="builder"><BuilderDashboardPage /></ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>
        } />
        <Route path="/admin/parts" element={
          <ProtectedRoute requiredRole="admin"><AdminPartsPage /></ProtectedRoute>
        } />
        <Route path="/admin/parts/new" element={
          <ProtectedRoute requiredRole="admin"><AdminPartNewPage /></ProtectedRoute>
        } />
        <Route path="/admin/parts/:id/edit" element={
          <ProtectedRoute requiredRole="admin"><AdminPartEditPage /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute requiredRole="admin"><AdminUsersPage /></ProtectedRoute>
        } />
        <Route path="/admin/applications" element={
          <ProtectedRoute requiredRole="admin"><AdminApplicationsPage /></ProtectedRoute>
        } />
        <Route path="/admin/rules" element={
          <ProtectedRoute requiredRole="admin"><AdminRulesPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

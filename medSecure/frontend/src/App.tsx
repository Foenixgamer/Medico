import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import LoginPage from './pages/LoginPage';
import MfaPage from './pages/MfaPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientNewPage from './pages/PatientNewPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AppointmentNewPage from './pages/AppointmentNewPage';
import RecordsPage from './pages/RecordsPage';
import RecordNewPage from './pages/RecordNewPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import MfaSetupPage from './pages/MfaSetupPage';
import Users from './pages/Users';
import ForgotPassword from './pages/ForgotPassword';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontSize: '13px', borderRadius: '8px', border: '0.5px solid #d3d1c7', background: '#fff', color: '#2c2c2a', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '10px 14px' } }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/mfa" element={<MfaPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><RoleRoute roles={['admin', 'doctor', 'nurse']}><PatientsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/patients/new" element={<ProtectedRoute><RoleRoute roles={['admin', 'doctor', 'nurse']}><PatientNewPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/patients/:token" element={<ProtectedRoute><RoleRoute roles={['admin', 'doctor', 'nurse']}><PatientDetailPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
          <Route path="/appointments/new" element={<ProtectedRoute><RoleRoute roles={['admin', 'doctor', 'nurse']}><AppointmentNewPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute><RoleRoute roles={['admin', 'doctor', 'nurse']}><RecordsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/records/:patientToken/new" element={<ProtectedRoute><RoleRoute roles={['admin', 'doctor', 'nurse']}><RecordNewPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><RoleRoute roles={['master', 'admin']}><Users /></RoleRoute></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><RoleRoute roles={['admin', 'doctor']}><ReportsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><RoleRoute roles={['admin', 'doctor', 'nurse']}><SettingsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/settings/mfa-setup" element={<ProtectedRoute><MfaSetupPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import AgentDashboard from './pages/AgentDashboard';
import CandidatePortal from './pages/CandidatePortal'; // Ensure this file is created next
import ResetPassword from './pages/ResetPassword';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Route: Login is the entry point */}
            <Route path="/" element={<Login />} />

            {/* Security Route: Forced for first-time login users */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Routes: Manage HR and Agents */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />

            {/* HR Routes: Create Candidates and view pipeline */}
            <Route path="/dashboard" element={<HRDashboard />} />

            {/* Agent Routes: Review assigned candidates and documents */}
            <Route path="/agent-dashboard" element={<AgentDashboard />} />

            {/* Candidate Routes: Phone OTP, Auto-Fetch, and Document Upload */}
            <Route path="/candidate-home" element={<CandidatePortal />} />

            {/* Fallback: Redirect any unknown URL to Login */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
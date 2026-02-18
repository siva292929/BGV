import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard'; // <--- IMPORT THIS
import ResetPassword from './pages/ResetPassword';

// Keep this placeholder until we build the Candidate Portal next
const CandidateHome = () => <div className="p-10 text-2xl font-bold text-orange-600">Candidate Portal - Upload Your Docs Here</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
        {/* Real HR Dashboard */}
        <Route path="/dashboard" element={<HRDashboard />} />
        
        <Route path="/candidate-home" element={<CandidateHome />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
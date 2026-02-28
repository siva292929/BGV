import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userId = user?.userId || user?._id;
    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', { userId, newPassword });
      alert("Password established successfully!");

      // Update global auth state
      await checkAuth();

      // Navigate based on role (matching Login.jsx logic)
      const role = res.data.role;
      if (role === 'ADMIN') navigate('/admin-dashboard');
      else if (role === 'HR') navigate('/dashboard');
      else if (role === 'AGENT') navigate('/agent-dashboard');
      else if (role === 'CANDIDATE') navigate('/candidate-home');
      else navigate('/');

    } catch (err) {
      alert(err.response?.data?.error || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05),transparent)]">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-slate-950 rounded-[32px] flex items-center justify-center text-white shadow-2xl mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">BGV</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Security Protocol</p>
        </div>

        <div className="bg-white p-10 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <ShieldAlert size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Recovery</h2>
          </div>

          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            As a security measure for your first login, you are required to establish a high-strength permanent password.
          </p>

          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">New Secure Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors">
                  <KeyRound size={20} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold focus:border-slate-950 outline-none transition"
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-indigo-600 text-white p-5 rounded-2xl transition-all font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-100 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>Establish Password <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-loose">
          Session restricted to password initialization only.<br />
          Contact support if you did not request this access.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
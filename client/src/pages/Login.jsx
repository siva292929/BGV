import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.isFirstLogin) {
        navigate('/reset-password');
      } else {
        redirectByRole(data.role);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    const userRole = role.toUpperCase();
    if (userRole === 'ADMIN') navigate('/admin-dashboard');
    else if (userRole === 'HR') navigate('/dashboard');
    else if (userRole === 'AGENT') navigate('/agent-dashboard');
    else navigate('/candidate-home');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-[440px] z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mb-6 shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">BGV</h1>
            <p className="text-slate-400">Secure Background Verification</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 text-white p-3.5 pl-12 rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white p-3.5 pl-12 rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2 mt-4 hover:translate-y-[-2px] active:translate-y-[0px]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-500 text-sm">
          Protected by Enterprise-grade Encryption
        </p>
      </div>
    </div>
  );
};

export default Login;
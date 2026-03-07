import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, Fingerprint } from 'lucide-react';
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
    const r = Number(role);
    if (r === 0) navigate('/admin-dashboard');       // ADMIN
    else if (r === 1) navigate('/dashboard');         // HR
    else if (r === 2) navigate('/agent-dashboard');   // AGENT
    else navigate('/candidate-home');                 // CANDIDATE
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Background Blobs (Matches Home) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-50 animate-[pulse_10s_infinite] rounded-full blur-[160px] opacity-60"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-50 animate-[pulse_8s_infinite] rounded-full blur-[160px] opacity-60"></div>

      {/* Background Grid */}
      <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="w-full max-w-[480px] relative animate-[fadeInUp_0.8s_ease-out]">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute -top-16 left-0 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors group"
        >
          <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="bg-white/40 backdrop-blur-3xl border border-white rounded-[48px] p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border-b-8 border-slate-100 relative">

          {/* Logo Integration */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-200/50 mb-8 border border-slate-50 relative group cursor-pointer" onClick={() => navigate('/')}>
              <div className="absolute inset-0 bg-indigo-50 rounded-[32px] scale-0 group-hover:scale-100 transition-transform duration-500 -z-10"></div>
              <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h1 className="text-4xl font-[1000] text-slate-900 tracking-[-0.04em] uppercase mb-2">BGV <span className="text-indigo-600">Portal</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Verification Engine</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="name@organization.com"
                  className="w-full bg-white border-2 border-slate-50 text-slate-900 p-5 pl-14 rounded-[24px] focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all font-bold placeholder:text-slate-200 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Key</label>
                <a href="#" className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Forgot?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-slate-50 text-slate-900 p-5 pl-14 rounded-[24px] focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all font-bold placeholder:text-slate-200"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="group relative w-full bg-slate-950 text-white p-6 rounded-[24px] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-slate-200 hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>Establish Session <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </form>

          {/* Social / Info Footer */}
          <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                    <ShieldCheck size={14} className="text-slate-400" />
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Trusted by <span className="text-slate-900">Global Security</span> Partners
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
          <span className="flex items-center gap-2"><Fingerprint size={12} /> Biometric Ready</span>
          <span className="flex items-center gap-2"><ShieldCheck size={12} /> AES-256 Cloud</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default Login;
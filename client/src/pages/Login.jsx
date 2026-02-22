import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, role, isFirstLogin, userId } = res.data;

      // Store session data
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);

      // REDIRECTION LOGIC
      if (isFirstLogin === true) {
        navigate('/reset-password');
      } else {
        // Normalizing role to uppercase for comparison
        const userRole = role.toUpperCase();
        if (userRole === 'ADMIN') {
          navigate('/admin-dashboard');
        } else if (userRole === 'HR') {
          navigate('/dashboard');
        } else if (userRole === 'AGENT') {
          navigate('/agent-dashboard');
        } else {
          navigate('/candidate-home');
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-slate-900 px-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">DarwinTrace</h2>
          <p className="text-slate-500 mt-2">Background Verification Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full border-b-2 border-slate-200 p-3 pl-10 focus:border-indigo-600 outline-none transition"
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full border-b-2 border-slate-200 p-3 pl-10 focus:border-indigo-600 outline-none transition"
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700 transition flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
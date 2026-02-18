import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, role, isFirstLogin, userId } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);

      if (isFirstLogin) {
        navigate('/reset-password');
      } else {
        if (role === 'ADMIN') navigate('/admin-dashboard');
        else if (role === 'HR') navigate('/dashboard');
        else navigate('/candidate-home');
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Login Failed');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">Login</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center border rounded p-2">
            <Mail className="text-gray-400 mr-2" size={20} />
            <input type="email" placeholder="Email" className="w-full outline-none" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="flex items-center border rounded p-2">
            <Lock className="text-gray-400 mr-2" size={20} />
            <input type="password" placeholder="Password" className="w-full outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold transition">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
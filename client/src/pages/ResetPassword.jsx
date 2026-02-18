import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', { userId, newPassword });
      alert("Password changed! Please login again.");
      localStorage.clear();
      navigate('/');
    } catch (err) {
      alert("Reset failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Reset Your Password</h2>
        <p className="text-sm text-gray-500 mb-4">Since this is your first login, you must choose a new password.</p>
        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="password" 
            placeholder="New Password" 
            className="w-full border p-2 rounded"
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 text-white p-2 rounded">Update Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
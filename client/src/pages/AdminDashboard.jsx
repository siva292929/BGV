import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Users, ShieldCheck, Trash2, Clipboard, HardDrive } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', empid: '', role: 'HR' });
  const [successMsg, setSuccessMsg] = useState('');
  const [tempPass, setTempPass] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/hrs'); // Using existing route to get all staff
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching staff", err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setTempPass('');
    setLoading(true);
    try {
      // Note: We'll use the create-hr route but pass the selected role
      const res = await axios.post('http://localhost:5000/api/admin/create-hr', formData);
      setSuccessMsg(`${formData.role} Account Created Successfully!`);
      setTempPass(res.data.tempPassword);
      setFormData({ name: '', email: '', empid: '', role: 'HR' }); 
      fetchUsers(); 
    } catch (err) {
      alert(err.response?.data?.error || "Error creating account");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("Delete this account permanently?")) {
      await axios.delete(`http://localhost:5000/api/admin/hr/${id}`);
      fetchUsers();
    }
  };

  // Filter stats
  const hrCount = users.filter(u => u.role === 'HR').length;
  const agentCount = users.filter(u => u.role === 'AGENT').length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Command Center</h1>
            <p className="text-gray-500">Manage HR Staff and Verification Agents</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Users size={20}/></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase">HR Staff</p><p className="text-xl font-bold">{hrCount}</p></div>
            </div>
            <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><ShieldCheck size={20}/></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase">Agents</p><p className="text-xl font-bold">{agentCount}</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-fit">
            <div className="flex items-center mb-6 text-indigo-600 gap-2">
              <UserPlus />
              <h2 className="text-xl font-bold">Register New Staff</h2>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Account Role</label>
                <select 
                  className="w-full border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="HR">Human Resources (HR)</option>
                  <option value="AGENT">Verification Agent</option>
                </select>
              </div>

              <input type="text" placeholder="Full Name" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              
              <input type="email" placeholder="Email Address" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              
              <input type="text" placeholder="Employee ID" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.empid} onChange={(e) => setFormData({...formData, empid: e.target.value})} required />
              
              <button disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg shadow-indigo-100 disabled:bg-gray-300">
                {loading ? "Processing..." : `Create ${formData.role} Account`}
              </button>
            </form>

            {successMsg && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-pulse">
                <p className="text-green-700 text-sm font-bold">{successMsg}</p>
                {tempPass && (
                  <div className="mt-3 flex items-center justify-between bg-white p-3 border rounded-lg shadow-inner">
                    <span className="text-sm font-mono font-bold text-gray-800">Pass: {tempPass}</span>
                    <button onClick={() => navigator.clipboard.writeText(tempPass)} className="text-indigo-600 hover:text-indigo-800 transition">
                      <Clipboard size={18}/>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Staff Directory</h2>
              <button onClick={fetchUsers} className="text-xs font-bold text-indigo-600 hover:underline">Refresh List</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 border-b uppercase text-[10px] font-black tracking-widest">
                    <th className="py-4 px-6">Staff Member</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Emp ID</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b hover:bg-indigo-50/30 transition">
                      <td className="py-4 px-6">
                        <p className="font-bold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'HR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-gray-600">{u.empid}</td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => deleteUser(u._id)} className="text-gray-300 hover:text-red-500 transition">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center gap-2 opacity-20">
                  <HardDrive size={48} />
                  <p className="font-bold">No staff members found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
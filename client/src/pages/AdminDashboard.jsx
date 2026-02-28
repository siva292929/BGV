import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Users, ShieldCheck, Trash2, Clipboard, HardDrive, LogOut, Loader2, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';


const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', empid: '', role: 'HR' });
  const [successMsg, setSuccessMsg] = useState('');
  const [tempPass, setTempPass] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/hrs');
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const hrCount = users.filter(u => u.role === 'HR').length;
  const agentCount = users.filter(u => u.role === 'AGENT').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex border-l border-slate-200">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 p-8 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-widest uppercase">Admin</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="bg-white/10 p-4 rounded-2xl text-white flex items-center gap-3">
            <Users size={20} className="text-indigo-400" />
            <span className="font-bold text-sm">Staff Directory</span>
          </div>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                <User size={20} />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-tight">{user?.name || "Administrator"}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Master Admin</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 font-bold text-xs p-4 rounded-2xl transition-all uppercase tracking-widest hover:bg-red-400/10">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Workspace Oversight</h1>
            <p className="text-slate-500 font-medium">Manage and monitor organizational staff and verification workflows.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><Users size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HR Records</p>
                <p className="text-2xl font-black text-slate-900">{hrCount}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600"><ShieldCheck size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent Pool</p>
                <p className="text-2xl font-black text-slate-900">{agentCount}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Registration Form */}
          <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <UserPlus size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">System Registration</h2>
            </div>

            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Role</label>
                <select
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-600 outline-none transition appearance-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="HR">Human Resources</option>
                  <option value="AGENT">Verification Agent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" placeholder="e.g. Alex Johnson" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-600 outline-none"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <input type="email" placeholder="alex@company.com" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-600 outline-none"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee ID</label>
                <input type="text" placeholder="DT-10294" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-600 outline-none"
                  value={formData.empid} onChange={(e) => setFormData({ ...formData, empid: e.target.value })} required />
              </div>

              <button disabled={loading} className="w-full bg-slate-950 hover:bg-indigo-600 text-white p-5 rounded-2xl transition-all font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-100 flex items-center justify-center gap-2 group">
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>Deploy Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>

            {successMsg && (
              <div className="mt-8 p-6 bg-green-50 border border-green-100 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-4">
                <p className="text-green-700 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} /> {successMsg}
                </p>
                {tempPass && (
                  <div className="flex items-center justify-between bg-white px-5 py-4 border border-green-200 rounded-2xl shadow-sm">
                    <span className="text-sm font-mono font-black text-slate-800 tracking-wider">PASS: {tempPass}</span>
                    <button onClick={() => navigator.clipboard.writeText(tempPass)} className="p-2 hover:bg-slate-50 rounded-xl transition">
                      <Clipboard size={18} className="text-indigo-600" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Directory List */}
          <section className="xl:col-span-2 bg-white rounded-[48px] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Staff Directory</h2>
              <button onClick={fetchUsers} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-xl transition">Force Refresh</button>
            </div>

            <div className="overflow-x-auto px-6 pb-6 mt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-300 uppercase text-[10px] font-black tracking-widest">
                    <th className="py-6 px-4">Member Identity</th>
                    <th className="py-6 px-4">System Role</th>
                    <th className="py-6 px-4">Entity ID</th>
                    <th className="py-6 px-4 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-white group-hover:shadow-sm">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{u.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'HR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                          {u.role === 'HR' ? 'Resources' : 'Verifier'}
                        </span>
                      </td>
                      <td className="py-6 px-4 font-mono text-xs font-bold text-slate-500">{u.empid}</td>
                      <td className="py-6 px-4 text-right">
                        <button onClick={() => deleteUser(u._id)} className="p-3 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="py-32 text-center flex flex-col items-center gap-4 animate-in fade-in duration-1000">
                  <div className="w-20 h-20 rounded-[40px] bg-slate-50 flex items-center justify-center text-slate-200">
                    <HardDrive size={40} />
                  </div>
                  <p className="font-black text-slate-300 uppercase tracking-widest text-xs">Directory is currently empty</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
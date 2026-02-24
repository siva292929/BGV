import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, UserCheck, Clock, Mail, LogOut, Loader2, ArrowRight, User as UserIcon, ShieldCheck, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HRDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/hr/candidates');
      setCandidates(res.data);
    } catch (err) {
      console.error("Error fetching candidates", err);
    }
  };

  const handleTrackDetails = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/hr/candidate-progress/${id}`);
      setSelectedCandidate(res.data);
      setShowModal(true);
    } catch (err) {
      alert("Error fetching details");
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/hr/create-candidate', formData);
      alert("Candidate invited successfully!");
      setFormData({ name: '', email: '' });
      fetchCandidates();
    } catch (err) {
      alert(err.response?.data?.error || "Error inviting candidate");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex border-l border-slate-200">
      {/* Sidebar and rest of the UI remains mostly same, adding modal at end */}
      <aside className="w-80 bg-slate-950 p-8 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/20 text-white">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-widest uppercase text-left">HR Portal</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left">Talent Verification</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="bg-white/10 p-4 rounded-2xl text-white flex items-center gap-3">
            <UserCheck size={20} className="text-blue-400" />
            <span className="font-bold text-sm">BGV Requests</span>
          </div>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                <UserIcon size={20} />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-tight">{user?.name || "HR Manager"}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left">HR Lead</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 font-bold text-xs p-4 rounded-2xl transition-all uppercase tracking-widest hover:bg-red-400/10">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Onboarding Pipeline</h1>
            <p className="text-slate-500 font-medium">Initiate and monitor background verification for new hires.</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><UserCheck size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Active Checks</p>
              <p className="text-2xl font-black text-slate-900">{candidates.length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <UserPlus size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">New BGV Invite</h2>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Candidate Name</label>
                <input type="text" placeholder=" Sarah Miller" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-blue-600 outline-none"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Personal Email</label>
                <input type="email" placeholder="sarah.m@email.com" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-blue-600 outline-none"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>

              <button disabled={loading} className="w-full bg-slate-950 hover:bg-blue-600 text-white p-5 rounded-2xl transition-all font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-100 flex items-center justify-center gap-2 group">
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>Send Invitation <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          </section>

          <section className="xl:col-span-2 bg-white rounded-[48px] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Verification Queue</h2>
              <button onClick={fetchCandidates} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-4 py-2 rounded-xl transition">Refresh</button>
            </div>

            <div className="overflow-x-auto px-6 pb-6 mt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-300 uppercase text-[10px] font-black tracking-widest">
                    <th className="py-6 px-4">Candidate Identity</th>
                    <th className="py-6 px-4">Current Status</th>
                    <th className="py-6 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {candidates.map(c => (
                    <tr key={c._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase">{c.name.charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${c.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                          c.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                          <Clock size={12} /> {c.status}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <button onClick={() => handleTrackDetails(c._id)} className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition uppercase tracking-widest">
                          Track Progress
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* TRACKING MODAL */}
      {showModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300">
            <div className="bg-slate-950 p-8 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center"><UserIcon size={24} /></div>
                <div>
                  <h3 className="font-black tracking-tight text-xl">{selectedCandidate.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Live Verification Flow</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors"><ShieldCheck size={28} /></button>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Milestone</p>
                  <p className="text-lg font-black text-slate-900">{selectedCandidate.status}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Auditor</p>
                  <p className="text-lg font-black text-slate-900">{selectedCandidate.assignedAgent?.name || "Pending"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Check-points</p>
                <div className="grid grid-cols-1 gap-3">
                  {selectedCandidate.bgvRequest ? (
                    Object.entries(selectedCandidate.bgvRequest.reviews).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{key}</span>
                        <div className="flex items-center gap-3">
                          {value.comment && <span className="text-[9px] text-slate-400 font-bold italic">"{value.comment}"</span>}
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${value.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' :
                            value.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {value.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No documents submitted yet</p>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={() => setShowModal(false)} className="w-full bg-slate-950 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Close Pipeline View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
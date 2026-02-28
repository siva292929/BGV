import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, UserCheck, Clock, Mail, LogOut, Loader2, ArrowRight, User as UserIcon, ShieldCheck, Briefcase, MessageCircle, FileText, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatHub from '../components/ChatPanel';

const HRDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [tempPass, setTempPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showHRDataModal, setShowHRDataModal] = useState(false);
  const [hrDataCandidate, setHrDataCandidate] = useState(null);
  const [hrDataForm, setHrDataForm] = useState({
    tenthPercentage: '', twelfthPercentage: '', degreeGPA: '', degreeName: '', degreeUniversity: '',
    previousCompany: '', previousDesignation: '', previousDuration: '',
    hrContactName: '', hrContactEmail: '', hrContactPhone: '', ctc: '', remarks: ''
  });
  const [hrDataLoading, setHrDataLoading] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const hrId = user?.userId || user?._id;

  useEffect(() => {
    if (hrId) fetchCandidates();
  }, [hrId]);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/hr/candidates?hrId=${hrId}`);
      setCandidates(res.data);
    } catch (err) {
      console.error("Error fetching candidates", err);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setTempPass('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/hr/create-candidate', { ...formData, hrId });
      setSuccessMsg("Candidate Created & Assigned!");
      setTempPass(res.data.tempPassword);
      setFormData({ name: '', email: '' });
      fetchCandidates();
    } catch (err) {
      alert(err.response?.data?.error || "Error creating candidate");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const openHRDataModal = (candidate) => {
    setHrDataCandidate(candidate);
    setHrDataForm({
      tenthPercentage: '', twelfthPercentage: '', degreeGPA: '', degreeName: '', degreeUniversity: '',
      previousCompany: '', previousDesignation: '', previousDuration: '',
      hrContactName: '', hrContactEmail: '', hrContactPhone: '', ctc: '', remarks: ''
    });
    setShowHRDataModal(true);
  };

  const submitHRData = async () => {
    setHrDataLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/hr/submit-hr-data/${hrDataCandidate._id}`, hrDataForm);
      alert("Reference data submitted successfully! Agent can now cross-verify.");
      setShowHRDataModal(false);
      fetchCandidates();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit data");
    } finally {
      setHrDataLoading(false);
    }
  };

  const pendingCount = candidates.filter(c => c.status === 'Pending').length;
  const reviewCount = candidates.filter(c => c.status === 'Under Review').length;
  const verifiedCount = candidates.filter(c => c.status === 'Verified').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex border-l border-slate-200">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 p-8 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/20 text-white">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-widest uppercase">HR Portal</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">BGV Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="bg-white/10 p-4 rounded-2xl text-white flex items-center gap-3">
            <UserCheck size={20} className="text-blue-400" />
            <span className="font-bold text-sm tracking-widest">My Candidates</span>
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
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Human Resources</p>
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
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Recruitment Pipeline</h1>
            <p className="text-slate-500 font-medium">Initiate and monitor background verification for new hires.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><UserCheck size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Candidates</p>
                <p className="text-2xl font-black text-slate-900">{candidates.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600"><ShieldCheck size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified</p>
                <p className="text-2xl font-black text-slate-900">{verifiedCount}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Create Candidate Form */}
          <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <UserPlus size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">New Candidate</h2>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" placeholder="e.g. John Doe" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-blue-600 outline-none"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input type="email" placeholder="john@email.com" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-blue-600 outline-none"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>

              <button disabled={loading} className="w-full bg-slate-950 hover:bg-blue-600 text-white p-5 rounded-2xl transition-all font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-100 flex items-center justify-center gap-2 group">
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>Send Invitation <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
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
                    <button onClick={() => navigator.clipboard.writeText(tempPass)} className="p-2 hover:bg-slate-50 rounded-xl transition text-blue-600 text-xs font-bold">
                      Copy
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Candidate List */}
          <section className="xl:col-span-2 bg-white rounded-[48px] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Candidate Pipeline</h2>
              <div className="flex items-center gap-3">
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">{pendingCount} Pending</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">{reviewCount} In Review</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">{verifiedCount} Verified</span>
              </div>
            </div>

            <div className="overflow-x-auto px-6 pb-6 mt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-300 uppercase text-[10px] font-black tracking-widest">
                    <th className="py-6 px-4">Candidate</th>
                    <th className="py-6 px-4">Status</th>
                    <th className="py-6 px-4">Agent</th>
                    <th className="py-6 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {candidates.map(c => (
                    <tr key={c._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-white group-hover:shadow-sm">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{c.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.status === 'Verified' ? 'bg-green-100 text-green-700' :
                          c.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            c.status === 'Under Review' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                          }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-sm text-slate-500 font-bold">
                        {c.assignedAgent?.name || 'Unassigned'}
                      </td>
                      <td className="py-6 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status !== 'Pending' && (
                            <button
                              onClick={() => openHRDataModal(c)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Submit Reference Data"
                            >
                              <FileText size={18} />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {candidates.length === 0 && (
                <div className="py-32 text-center flex flex-col items-center gap-4 animate-in fade-in duration-1000">
                  <div className="w-20 h-20 rounded-[40px] bg-slate-50 flex items-center justify-center text-slate-200">
                    <UserPlus size={40} />
                  </div>
                  <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No candidates yet. Create one above.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* HR Data Modal */}
      {showHRDataModal && hrDataCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Submit Reference Data</h3>
                <p className="text-slate-400 text-sm mt-1">For: <strong>{hrDataCandidate.name}</strong></p>
              </div>
              <button onClick={() => setShowHRDataModal(false)} className="text-slate-400 hover:text-slate-900 text-2xl font-bold">✕</button>
            </div>

            <div className="space-y-8">
              {/* Academic */}
              <div className="space-y-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Building size={16} /> Academic Records</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">10th %</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.tenthPercentage} onChange={e => setHrDataForm({ ...hrDataForm, tenthPercentage: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">12th %</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.twelfthPercentage} onChange={e => setHrDataForm({ ...hrDataForm, twelfthPercentage: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Degree GPA</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.degreeGPA} onChange={e => setHrDataForm({ ...hrDataForm, degreeGPA: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Degree Name</label>
                    <input type="text" placeholder="e.g. B.Tech CSE" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.degreeName} onChange={e => setHrDataForm({ ...hrDataForm, degreeName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">University</label>
                    <input type="text" placeholder="University name" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.degreeUniversity} onChange={e => setHrDataForm({ ...hrDataForm, degreeUniversity: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div className="space-y-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Briefcase size={16} /> Previous Employment</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Company</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.previousCompany} onChange={e => setHrDataForm({ ...hrDataForm, previousCompany: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Designation</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.previousDesignation} onChange={e => setHrDataForm({ ...hrDataForm, previousDesignation: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Duration</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.previousDuration} onChange={e => setHrDataForm({ ...hrDataForm, previousDuration: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">HR Contact Name</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.hrContactName} onChange={e => setHrDataForm({ ...hrDataForm, hrContactName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">HR Email</label>
                    <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.hrContactEmail} onChange={e => setHrDataForm({ ...hrDataForm, hrContactEmail: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">HR Phone</label>
                    <input type="tel" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.hrContactPhone} onChange={e => setHrDataForm({ ...hrDataForm, hrContactPhone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">CTC</label>
                    <input type="text" placeholder="e.g. 12 LPA" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.ctc} onChange={e => setHrDataForm({ ...hrDataForm, ctc: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Remarks</label>
                    <input type="text" placeholder="Any notes" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl font-bold outline-none focus:border-blue-600"
                      value={hrDataForm.remarks} onChange={e => setHrDataForm({ ...hrDataForm, remarks: e.target.value })} />
                  </div>
                </div>
              </div>

              <button
                onClick={submitHRData}
                disabled={hrDataLoading}
                className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {hrDataLoading ? <Loader2 className="animate-spin" /> : <>Submit Reference Data <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Hub */}
      <ChatHub
        currentUserId={hrId}
      />
    </div>
  );
};

export default HRDashboard;
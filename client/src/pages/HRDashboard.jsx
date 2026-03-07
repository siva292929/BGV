import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, UserCheck, Clock, Mail, LogOut, Loader2, ArrowRight, User as UserIcon, ShieldCheck, Briefcase, MessageCircle, FileText, Building, Upload, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { STATUS, STATUS_LABELS, ROLES } from '../constants';
import ChatHub from '../components/ChatPanel';

const HRDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '',
    aadharNumber: '', panNumber: '',
    tenthPercentage: '', twelfthPercentage: '', degreeGPA: '', degreeName: '', degreeUniversity: '',
    previousCompany: '', previousDesignation: '', previousDuration: '',
    hrContactName: '', hrContactEmail: '', hrContactPhone: '', ctc: '', remarks: ''
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [tempPass, setTempPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const hrId = user?.userId || user?.uid;

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
      setFormData({
        name: '', email: '',
        aadharNumber: '', panNumber: '',
        tenthPercentage: '', twelfthPercentage: '', degreeGPA: '', degreeName: '', degreeUniversity: '',
        previousCompany: '', previousDesignation: '', previousDuration: '',
        hrContactName: '', hrContactEmail: '', hrContactPhone: '', ctc: '', remarks: ''
      });
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

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append('file', file);
    formDataObj.append('hrId', hrId);

    setBulkImportLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/hr/bulk-import', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Successfully imported ${res.data.importedCount} candidates. ${res.data.errorCount} error(s).`);
      fetchCandidates();
    } catch (err) {
      alert(`Import failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setBulkImportLoading(false);
      e.target.value = null; // Clear input
    }
  };



  const pendingCount = candidates.filter(c => c.status === STATUS.PENDING).length;
  const reviewCount = candidates.filter(c => c.status === STATUS.UNDER_REVIEW).length;
  const verifiedCount = candidates.filter(c => c.status === STATUS.VERIFIED).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex border-l border-slate-200">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 p-8 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-white p-2 rounded-2xl shadow-lg shadow-blue-400/10 border border-slate-800 transition-all hover:scale-110 hover:rotate-3 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-widest uppercase italic">BGV <span className="text-blue-500">Hub</span></h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">HR Operations</p>
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

            {/* Bulk Import Option */}
            <div className="mb-10 p-6 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulk Invite</span>
                <a href="#" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline" onClick={(e) => {
                  e.preventDefault();
                  const headers = "name,email,aadharNumber,panNumber,tenthPercentage,twelfthPercentage,degreeGPA,degreeName,degreeUniversity,previousCompany,previousDesignation,previousDuration,ctc,remarks";
                  const row1 = "John Doe,john@example.com,123456789012,ABCDE1234F,85,88,8.5,B.Tech CSE,IIT Bombay,Tech Corp,Software Engineer,2 years,12 LPA,Excellent candidate";
                  const csvContent = `${headers}\n${row1}`;
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = "sample_candidates_with_reference.csv";
                  link.click();
                }}>Download Sample</a>
              </div>
              <label className="flex flex-col items-center justify-center gap-3 cursor-pointer group">
                <input type="file" className="hidden" accept=".csv" onChange={handleBulkImport} disabled={bulkImportLoading} />
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all shadow-sm">
                  {bulkImportLoading ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                  {bulkImportLoading ? "Importing candidates..." : "Upload CSV to invite candidates in bulk"}
                </span>
              </label>
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

              {/* Identity */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🪪 Identity</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Aadhaar Number" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.aadharNumber} onChange={e => setFormData({ ...formData, aadharNumber: e.target.value })} />
                  <input type="text" placeholder="PAN Number" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.panNumber} onChange={e => setFormData({ ...formData, panNumber: e.target.value })} />
                </div>
              </div>

              {/* Academic */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🎓 Academic</p>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="10th %" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.tenthPercentage} onChange={e => setFormData({ ...formData, tenthPercentage: e.target.value })} />
                  <input type="text" placeholder="12th %" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.twelfthPercentage} onChange={e => setFormData({ ...formData, twelfthPercentage: e.target.value })} />
                  <input type="text" placeholder="Degree GPA" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.degreeGPA} onChange={e => setFormData({ ...formData, degreeGPA: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Degree Name (e.g. B.Tech CSE)" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.degreeName} onChange={e => setFormData({ ...formData, degreeName: e.target.value })} />
                  <input type="text" placeholder="University" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.degreeUniversity} onChange={e => setFormData({ ...formData, degreeUniversity: e.target.value })} />
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">💼 Previous Employment</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Company" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.previousCompany} onChange={e => setFormData({ ...formData, previousCompany: e.target.value })} />
                  <input type="text" placeholder="Designation" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.previousDesignation} onChange={e => setFormData({ ...formData, previousDesignation: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Duration (e.g. 2 years)" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.previousDuration} onChange={e => setFormData({ ...formData, previousDuration: e.target.value })} />
                  <input type="text" placeholder="CTC (e.g. 12 LPA)" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.ctc} onChange={e => setFormData({ ...formData, ctc: e.target.value })} />
                </div>
              </div>

              {/* Previous HR Contact */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📞 Previous HR Contact</p>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="Contact Name" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.hrContactName} onChange={e => setFormData({ ...formData, hrContactName: e.target.value })} />
                  <input type="email" placeholder="Contact Email" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.hrContactEmail} onChange={e => setFormData({ ...formData, hrContactEmail: e.target.value })} />
                  <input type="tel" placeholder="Contact Phone" className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600"
                    value={formData.hrContactPhone} onChange={e => setFormData({ ...formData, hrContactPhone: e.target.value })} />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📝 Remarks</p>
                <textarea placeholder="Any notes for the verification agent..." rows={2}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 resize-none"
                  value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
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
                    <tr key={c.uid} className="group hover:bg-slate-50/50 transition-all duration-300">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-white group-hover:shadow-sm">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{c.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{c.email}</p>
                            {c.executiveSummary && (
                              <p className="text-[10px] text-blue-600 font-bold mt-1 max-w-xs line-clamp-1 italic">
                                "{c.executiveSummary}"
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.status === STATUS.VERIFIED ? 'bg-green-100 text-green-700' :
                          c.status === STATUS.REJECTED ? 'bg-red-100 text-red-700' :
                            c.status === STATUS.UNDER_REVIEW ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                          }`}>
                          {STATUS_LABELS[c.status] || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-sm text-slate-500 font-bold">
                        {c.assignedAgentData?.name || 'Unassigned'}
                      </td>
                      <td className="py-6 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.bgvRequest && (
                            <button
                              onClick={() => window.open(`http://localhost:5000/api/hr/report/${c.uid}`, '_blank')}
                              className="p-2 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all group/btn"
                              title="Download BGV Report"
                            >
                              <Download size={16} />
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


      {/* Chat Hub */}
      <ChatHub
        currentUserId={hrId}
        currentUserRole={ROLES.HR}
      />
    </div>
  );
};

export default HRDashboard;
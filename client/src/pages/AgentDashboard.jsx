import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ClipboardCheck, User, Search, FileText, CheckCircle, XCircle,
  ExternalLink, GraduationCap, Briefcase, MapPin, Shield, LogOut,
  Loader2, ArrowRight, User as UserIcon, Check, MessageCircle, Building, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatHub from '../components/ChatPanel';

const AgentDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCrossVerify, setShowCrossVerify] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({}); // local comment state per doc
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const agentId = user?.userId || user?._id;

  useEffect(() => {
    if (agentId) fetchMyTasks();
  }, [agentId]);

  const fetchMyTasks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/hr/candidates`);
      const myIds = res.data.filter(c => c.assignedAgent?._id === agentId || c.assignedAgent === agentId).map(c => c._id);

      const detailPromises = myIds.map(id => axios.get(`http://localhost:5000/api/hr/candidate-progress/${id}`));
      const details = await Promise.all(detailPromises);
      setTasks(details.map(d => d.data));
    } catch (err) {
      console.error("Error fetching tasks", err);
    }
  };

  // Initialize comment drafts when a task is selected
  useEffect(() => {
    if (selectedTask?.bgvRequest?.reviews) {
      const drafts = {};
      Object.entries(selectedTask.bgvRequest.reviews).forEach(([key, val]) => {
        drafts[key] = val.comment || '';
      });
      setCommentDrafts(drafts);
    }
  }, [selectedTask?._id]);

  const handleReviewDoc = async (docType, status) => {
    if (!selectedTask?.bgvRequest?._id) {
      alert("Verification session not initialized.");
      return;
    }
    const comment = commentDrafts[docType] || '';
    try {
      await axios.post(`http://localhost:5000/api/candidate/update-review`, {
        candidateId: selectedTask._id,
        requestId: selectedTask.bgvRequest._id,
        documentType: docType,
        status,
        comment
      });
      fetchMyTasks();
      const updated = await axios.get(`http://localhost:5000/api/hr/candidate-progress/${selectedTask._id}`);
      setSelectedTask(updated.data);
    } catch (err) {
      alert("Review failed to save");
    }
  };

  const handleStatusUpdate = async (candidateId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/candidate/update-status`, {
        candidateId,
        status: newStatus,
        agentId: agentId
      });
      alert(`Case marked as ${newStatus}. Case is now locked.`);
      setSelectedTask(null);
      fetchMyTasks();
    } catch (err) {
      alert(err.response?.data?.error || "Status update failed");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const allDocTypes = ['aadhar', 'pan', 'degree', 'twelfth', 'tenth', 'experience', 'payslip', 'releasingLetter', 'addressProof', 'bankStatement', 'signature'];

  const docLabels = {
    aadhar: 'Aadhaar Card', pan: 'PAN Card', degree: 'Degree Certificate', twelfth: '12th Marksheet',
    tenth: '10th Marksheet', experience: 'Experience Letter', payslip: 'Payslip',
    releasingLetter: 'Releasing Letter', addressProof: 'Address Proof', bankStatement: 'Bank Statement', signature: 'Signature'
  };

  const hrData = selectedTask?.bgvRequest?.hrData;
  const candidateDetails = selectedTask?.submission?.submittedDetails;


  return (
    <div className="min-h-screen bg-[#f8fafc] flex border-l border-slate-200 uppercase">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 p-8 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-600/20 text-white">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-widest uppercase">Agent Hub</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">BGV Verification</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="bg-white/10 p-4 rounded-2xl text-white flex items-center gap-3">
            <FileText size={20} className="text-emerald-400" />
            <span className="font-bold text-sm tracking-widest">My Cases</span>
          </div>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center text-emerald-400">
                <UserIcon size={20} />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-tight">{user?.name || "Agent"}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lead Verifier</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 font-bold text-xs p-4 rounded-2xl transition-all uppercase tracking-widest hover:bg-red-400/10">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden h-screen">
        <section className="w-96 border-r border-slate-100 flex flex-col bg-white">
          <div className="p-8 border-b border-slate-50">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Queue</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{tasks.length} ACTIVE AUDITS</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {tasks.map(task => (
              <button
                key={task._id}
                onClick={() => { setSelectedTask(task); setShowCrossVerify(false); }}
                className={`w-full p-6 rounded-[32px] transition-all duration-300 group ${selectedTask?._id === task._id
                  ? 'bg-slate-950 text-white shadow-2xl'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedTask?._id === task._id ? 'bg-white/10 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                    <UserIcon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm tracking-tight">{task.name}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">{task.status}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="flex-1 bg-[#f8fafc] p-12 overflow-y-auto">
          {selectedTask ? (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <header className="flex justify-between items-start text-left">
                <div>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedTask.status}</span>
                    {selectedTask.bgvRequest?.isFinalized && (
                      <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">CASE LOCKED</span>
                    )}
                    {hrData && Object.values(hrData).some(v => v) && (
                      <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">HR DATA AVAILABLE</span>
                    )}
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedTask.name}</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">{selectedTask.email}</p>
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                  {hrData && (
                    <button
                      onClick={() => setShowCrossVerify(!showCrossVerify)}
                      className={`px-6 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-sm transition-all border ${showCrossVerify ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'}`}
                    >
                      <Building size={16} className="inline mr-2" /> Cross-Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate(selectedTask._id, 'Rejected')}
                    disabled={selectedTask.bgvRequest?.isFinalized}
                    className="bg-white text-red-600 px-6 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-red-50 transition-all border border-red-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedTask._id, 'Verified')}
                    disabled={selectedTask.bgvRequest?.isFinalized}
                    className="bg-emerald-600 text-white px-6 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Approve
                  </button>
                </div>
              </header>

              {/* Cross-Verification Panel */}
              {showCrossVerify && hrData && (
                <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100 space-y-6 animate-in fade-in duration-500">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">HR Reference Data vs Candidate Submitted Data</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-blue-100">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4">HR PROVIDED</p>
                      <div className="space-y-3 text-sm">
                        {hrData.tenthPercentage && <div><span className="text-slate-400 text-xs">10th:</span> <strong>{hrData.tenthPercentage}%</strong></div>}
                        {hrData.twelfthPercentage && <div><span className="text-slate-400 text-xs">12th:</span> <strong>{hrData.twelfthPercentage}%</strong></div>}
                        {hrData.degreeGPA && <div><span className="text-slate-400 text-xs">Degree:</span> <strong>{hrData.degreeGPA} ({hrData.degreeName}, {hrData.degreeUniversity})</strong></div>}
                        {hrData.previousCompany && <div><span className="text-slate-400 text-xs">Company:</span> <strong>{hrData.previousCompany}</strong></div>}
                        {hrData.previousDesignation && <div><span className="text-slate-400 text-xs">Designation:</span> <strong>{hrData.previousDesignation}</strong></div>}
                        {hrData.previousDuration && <div><span className="text-slate-400 text-xs">Duration:</span> <strong>{hrData.previousDuration}</strong></div>}
                        {hrData.hrContactName && <div><span className="text-slate-400 text-xs">HR Contact:</span> <strong>{hrData.hrContactName} ({hrData.hrContactEmail})</strong></div>}
                        {hrData.ctc && <div><span className="text-slate-400 text-xs">CTC:</span> <strong>{hrData.ctc}</strong></div>}
                        {hrData.remarks && <div><span className="text-slate-400 text-xs">Remarks:</span> <strong>{hrData.remarks}</strong></div>}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">CANDIDATE SUBMITTED</p>
                      <div className="space-y-3 text-sm">
                        {selectedTask.submission?.autofetchedDetails?.tenthPercentage && <div><span className="text-slate-400 text-xs">10th:</span> <strong>{selectedTask.submission.autofetchedDetails.tenthPercentage}%</strong></div>}
                        {selectedTask.submission?.autofetchedDetails?.twelfthPercentage && <div><span className="text-slate-400 text-xs">12th:</span> <strong>{selectedTask.submission.autofetchedDetails.twelfthPercentage}%</strong></div>}
                        {selectedTask.submission?.autofetchedDetails?.degreeGPA && <div><span className="text-slate-400 text-xs">Degree:</span> <strong>{selectedTask.submission.autofetchedDetails.degreeGPA}</strong></div>}
                        {candidateDetails?.previousCompany && <div><span className="text-slate-400 text-xs">Company:</span> <strong>{candidateDetails.previousCompany}</strong></div>}
                        {candidateDetails?.previousDesignation && <div><span className="text-slate-400 text-xs">Designation:</span> <strong>{candidateDetails.previousDesignation}</strong></div>}
                        {candidateDetails?.previousDuration && <div><span className="text-slate-400 text-xs">Duration:</span> <strong>{candidateDetails.previousDuration}</strong></div>}
                        {candidateDetails?.hrContactName && <div><span className="text-slate-400 text-xs">HR Contact:</span> <strong>{candidateDetails.hrContactName} ({candidateDetails.hrContactEmail})</strong></div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-Fetched Master Profile */}
              {selectedTask.submission?.autofetchedDetails && (
                <div className="bg-indigo-50/50 p-8 rounded-[40px] border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Master Records (Auto-Fetched)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {Object.entries(selectedTask.submission.autofetchedDetails).map(([key, value]) => value ? (
                      <div key={key}>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="font-black text-slate-800">{value}</p>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Audit</p>
                  {selectedTask.submission?.submittedDetails?.isFresher && (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">FRESHER</span>
                  )}
                </div>
                {allDocTypes.map(doc => {
                  if (selectedTask.submission?.submittedDetails?.isFresher && ['experience', 'payslip', 'releasingLetter', 'bankStatement'].includes(doc)) return null;

                  const docPath = selectedTask.submission?.documents?.[doc] || selectedTask.documents?.[doc];
                  const review = selectedTask.bgvRequest?.reviews?.[doc];
                  if (!review) return null;
                  const isAutoVerified = review?.comment?.includes('Auto-verified');

                  return (
                    <div key={doc} className={`bg-white p-8 rounded-[40px] border-2 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group transition-all ${isAutoVerified ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100 hover:border-emerald-500'}`}>
                      <div className="flex items-center gap-6 flex-1">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isAutoVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                          {['aadhar', 'pan', 'addressProof'].includes(doc) ? <Shield size={24} /> :
                            ['degree', 'twelfth', 'tenth'].includes(doc) ? <GraduationCap size={24} /> :
                              ['experience', 'payslip', 'releasingLetter', 'bankStatement'].includes(doc) ? <Briefcase size={24} /> : <FileText size={24} />}
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{docLabels[doc] || doc}</p>
                          <div className="flex items-center gap-2">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${review?.status === 'Verified' ? 'text-emerald-600' :
                              review?.status === 'Rejected' ? 'text-red-600' : 'text-slate-400'
                              }`}>{review?.status}</p>
                            {isAutoVerified && (
                              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Auto-Verified</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        {!isAutoVerified && !selectedTask.bgvRequest?.isFinalized ? (
                          <>
                            <input
                              placeholder="Add note..."
                              className="bg-slate-50 border-2 border-slate-100 p-3 px-5 rounded-2xl text-[10px] font-bold text-slate-600 outline-none focus:border-emerald-600 transition-all w-full md:w-48"
                              value={commentDrafts[doc] || ''}
                              onChange={(e) => setCommentDrafts(prev => ({ ...prev, [doc]: e.target.value }))}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReviewDoc(doc, 'Verified')}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${review?.status === 'Verified' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                                Verify
                              </button>
                              <button
                                onClick={() => handleReviewDoc(doc, 'Rejected')}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${review?.status === 'Rejected' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600'}`}>
                                Flag
                              </button>
                            </div>
                          </>
                        ) : isAutoVerified ? (
                          <div className="bg-emerald-100/50 px-6 py-3 rounded-2xl border border-emerald-200">
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Auto-Verified via Master DB</p>
                          </div>
                        ) : (
                          <div className="bg-red-100/50 px-6 py-3 rounded-2xl border border-red-200">
                            <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">Case Finalized</p>
                          </div>
                        )}

                        {docPath ? (
                          <a href={`http://localhost:5000/${docPath}`} target="_blank" rel="noreferrer" className="p-4 bg-slate-950 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg">
                            <ExternalLink size={18} />
                          </a>
                        ) : (
                          <div className="p-4 bg-slate-100 text-slate-300 rounded-2xl cursor-not-allowed" title="No document">
                            <ExternalLink size={18} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Shield size={100} className="mb-8 text-slate-200" />
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">SELECT A CASE</h3>
              <p className="text-xs font-black uppercase tracking-[0.3em] mt-2">Choose from queue to begin verification</p>
            </div>
          )}
        </section>
      </main>

      {/* Chat Hub */}
      <ChatHub currentUserId={agentId} />
    </div>
  );
};

export default AgentDashboard;
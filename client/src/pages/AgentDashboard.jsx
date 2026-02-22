import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClipboardCheck, User, Search, FileText, CheckCircle, XCircle, 
  ExternalLink, GraduationCap, Briefcase, MapPin, Shield 
} from 'lucide-react';

const AgentDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const agentId = localStorage.getItem('userId');

  useEffect(() => {
    fetchMyTasks();
  }, [agentId]);

  const fetchMyTasks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/hr/candidates`);
      const myTasks = res.data.filter(c => c.assignedAgent?._id === agentId);
      setTasks(myTasks);
    } catch (err) {
      console.error("Error fetching tasks", err);
    }
  };

  const handleStatusUpdate = async (candidateId, newStatus) => {
    try {
      // You would create this route in candidate.js to update the status
      await axios.patch(`http://localhost:5000/api/candidate/update-status`, { 
        candidateId, 
        status: newStatus 
      });
      alert(`Candidate marked as ${newStatus}`);
      setSelectedTask(null);
      fetchMyTasks();
    } catch (err) {
      alert("Status update failed");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Agent Verification Hub</h1>
            <p className="text-gray-500 font-medium">Reviewing {tasks.length} Assigned Background Checks</p>
          </div>
          <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-3">
            <ClipboardCheck size={20} />
            <span className="font-bold">Queue: {tasks.length} Active</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: TASK LIST */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Pending Review</h2>
            {tasks.map(task => (
              <div 
                key={task._id} 
                onClick={() => setSelectedTask(task)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedTask?._id === task._id ? 'border-indigo-600 bg-white shadow-xl scale-[1.02]' : 'border-transparent bg-white shadow-sm hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 p-3 rounded-xl text-gray-600"><User size={20} /></div>
                  <div>
                    <p className="font-bold text-gray-900">{task.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{task.status}</p>
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <Search className="mx-auto text-gray-300 mb-2" size={40} />
                <p className="text-gray-500 text-sm font-bold">No tasks found</p>
              </div>
            )}
          </div>

          {/* RIGHT: REVIEW PANEL */}
          <div className="lg:col-span-8">
            {selectedTask ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-indigo-50/30">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedTask.name}</h2>
                    <p className="text-gray-500 text-sm font-medium">{selectedTask.email} • {selectedTask.phoneNumber || 'Phone Not Linked'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusUpdate(selectedTask._id, 'Rejected')} className="bg-red-50 text-red-600 p-3 rounded-xl hover:bg-red-100 transition"><XCircle size={24}/></button>
                    <button onClick={() => handleStatusUpdate(selectedTask._id, 'Verified')} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 flex items-center gap-2">
                      <CheckCircle size={20}/> Approve BGV
                    </button>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Category: Identity */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> Identity Verification</h3>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 mb-2">AADHAAR / PAN DATA</p>
                      {selectedTask.status === 'Auto-Verified' ? (
                        <p className="text-green-600 text-sm font-bold">✓ Auto-Verified by Master Database</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button className="flex items-center justify-between bg-white p-3 rounded-xl border text-sm font-medium hover:border-indigo-600 transition">
                            View Uploaded Aadhaar <ExternalLink size={14}/>
                          </button>
                          <button className="flex items-center justify-between bg-white p-3 rounded-xl border text-sm font-medium hover:border-indigo-600 transition">
                            View Uploaded PAN <ExternalLink size={14}/>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category: Education */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><GraduationCap size={14}/> Academic Credentials</h3>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
                      <button className="flex items-center justify-between bg-white p-3 rounded-xl border text-sm font-medium hover:border-indigo-600 transition">
                        Degree/Provisional <ExternalLink size={14}/>
                      </button>
                      <button className="flex items-center justify-between bg-white p-3 rounded-xl border text-sm font-medium hover:border-indigo-600 transition">
                        High School (12th) <ExternalLink size={14}/>
                      </button>
                    </div>
                  </div>

                  {/* Category: Employment */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Briefcase size={14}/> Work History</h3>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
                      <button className="flex items-center justify-between bg-white p-3 rounded-xl border text-sm font-medium hover:border-indigo-600 transition">
                        Experience Letter <ExternalLink size={14}/>
                      </button>
                      <button className="flex items-center justify-between bg-white p-3 rounded-xl border text-sm font-medium hover:border-indigo-600 transition">
                        Previous Payslips <ExternalLink size={14}/>
                      </button>
                    </div>
                  </div>

                  {/* Category: Address */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> Address Proof</h3>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <button className="w-full flex items-center justify-between bg-white p-3 rounded-xl border text-sm font-medium hover:border-indigo-600 transition">
                        Utility Bill / Agreement <ExternalLink size={14}/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-300">
                <FileText size={64} className="mb-4" />
                <p className="font-bold text-lg">Select a candidate from the left<br/>to begin document verification.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
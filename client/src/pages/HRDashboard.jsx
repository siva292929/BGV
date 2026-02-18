import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, UserCheck, Clock, Mail } from 'lucide-react';

const HRDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">HR Verification Portal</h1>
            <p className="text-gray-500 text-sm">Manage candidate background checks and onboarding.</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border flex items-center gap-4">
             <div className="text-right">
                <p className="text-xs text-gray-400 font-bold uppercase">Active Cases</p>
                <p className="text-xl font-bold text-blue-600">{candidates.length}</p>
             </div>
             <div className="h-8 w-[1px] bg-gray-200"></div>
             <UserCheck className="text-blue-500" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Side */}
          <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-blue-600"/> New BGV Request
            </h2>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                <input type="text" className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-blue-400" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
                <input type="email" className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-blue-400" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 transition disabled:bg-gray-400">
                {loading ? "Sending Invite..." : "Invite Candidate"}
              </button>
            </form>
          </div>

          {/* List Side */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Candidate</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c._id} className="border-t hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className="font-bold text-gray-700">{c.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={12}/> {c.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit
                        ${c.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        <Clock size={10}/> {c.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-blue-600 text-sm font-semibold hover:underline">View Progress</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {candidates.length === 0 && <p className="p-10 text-center text-gray-400">No candidates invited yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
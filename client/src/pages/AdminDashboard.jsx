import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [hrs, setHrs] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', empid: '' });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchHRs();
  }, []);

  const fetchHRs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/hrs');
      setHrs(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const handleAddHR = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/admin/create-hr', formData);
      setSuccess(`Account Created! Temp Pass: ${res.data.tempPassword}`);
      setFormData({ name: '', email: '', empid: '' });
      fetchHRs();
    } catch (err) {
      alert(err.response?.data?.error || "Error creating HR");
    }
  };

  const deleteHR = async (id) => {
    if (window.confirm("Delete HR?")) {
      await axios.delete(`http://localhost:5000/api/admin/hr/${id}`);
      fetchHRs();
    }
  };

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">Add New HR</h2>
          <form onSubmit={handleAddHR} className="space-y-4">
            <input type="text" placeholder="Name" className="w-full border p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="email" placeholder="Email" className="w-full border p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            <input type="text" placeholder="Emp ID" className="w-full border p-2" value={formData.empid} onChange={e => setFormData({...formData, empid: e.target.value})} required />
            <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">Create HR</button>
          </form>
          {success && <p className="mt-4 text-green-600 font-bold">{success}</p>}
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl mb-4 font-semibold">HR List</h2>
          <ul>
            {hrs.map(hr => (
              <li key={hr._id} className="border-b py-2 flex justify-between items-center">
                <span>{hr.name} ({hr.empid})</span>
                <button onClick={() => deleteHR(hr._id)} className="text-red-500">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
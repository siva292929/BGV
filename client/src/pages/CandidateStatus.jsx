import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Shield, LogOut, CheckCircle, Clock, XCircle, AlertCircle,
  User, Phone, Briefcase, FileText, RefreshCw, Loader2, Upload, MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatHub from '../components/ChatPanel';
import { ROLES, STATUS, STATUS_LABELS, REVIEW, REVIEW_LABELS } from '../constants';

const CandidateStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reuploadFile, setReuploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [bgvRequestId, setBgvRequestId] = useState(null);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userId = user?.userId || user?.uid;

  useEffect(() => {
    if (userId) {
      fetchVerificationStatus();
      const interval = setInterval(fetchVerificationStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchVerificationStatus = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`http://localhost:5000/api/candidate/verification-status/${userId}`, {
        withCredentials: true
      });
      setStatus(res.data);
      if (res.data.bgvRequestId) {
        setBgvRequestId(res.data.bgvRequestId);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleBackToPortal = () => {
    navigate('/candidate-home');
  };

  const handleReupload = async () => {
    if (!reuploadFile || !selectedDoc) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', reuploadFile);
      formData.append('candidateId', userId);
      formData.append('documentType', selectedDoc);
      formData.append('bgvRequestId', bgvRequestId || status?.bgvRequestId);

      const response = await axios.post(
        'http://localhost:5000/api/candidate/re-upload-document',
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (response.data.success) {
        alert('Document re-uploaded successfully! The agent will review it shortly.');
        setSelectedDoc(null);
        setReuploadFile(null);
        setTimeout(() => { fetchVerificationStatus(); }, 500);
      }
    } catch (err) {
      console.error('Error re-uploading document:', err);
      alert(err.response?.data?.error || 'Failed to re-upload document');
    } finally {
      setUploading(false);
    }
  };

  const docLabels = {
    aadhar: 'Aadhaar Card', pan: 'PAN Card', degree: 'Degree Certificate', twelfth: '12th Marksheet',
    tenth: '10th Marksheet', experience: 'Experience Letter', payslip: 'Payslip',
    releasingLetter: 'Releasing Letter', addressProof: 'Address Proof', bankStatement: 'Bank Statement', signature: 'Signature'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin mx-auto text-indigo-600" size={48} />
          <p className="text-white font-bold">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <AlertCircle className="text-yellow-500 mx-auto" size={64} />
          <h2 className="text-white text-2xl font-bold">No Verification Found</h2>
          <p className="text-slate-400">Please submit your documents first.</p>
          <button
            onClick={handleBackToPortal}
            className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
          >
            Go to Portal
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round((status.progress.verified / status.progress.total) * 100);

  const getDisplayStatus = () => {
    if (status.isFinalized) return status.status;
    return 'Under Review';
  };

  const statusColors = {
    'Verified': 'bg-green-600 text-white',
    'Rejected': 'bg-red-600 text-white',
    'Under Review': 'bg-amber-600 text-white'
  };

  const getStatusIcon = (docStatus) => {
    if (docStatus === REVIEW.VERIFIED) return <CheckCircle className="text-green-600" size={24} />;
    if (docStatus === REVIEW.REJECTED) return <XCircle className="text-red-600" size={24} />;
    return <Clock className="text-amber-600" size={24} />;
  };

  const rejectedDocs = Object.entries(status.reviews).filter(([_, review]) => review.status === REVIEW.REJECTED);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <Shield className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-white font-black text-2xl">BGV</h1>
              <p className="text-slate-400 text-xs font-bold uppercase">Verification Status</p>
            </div>
          </div>
          <div className="flex gap-4">

            <button
              onClick={fetchVerificationStatus}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/10 text-white p-3 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl hover:bg-red-600/20 transition-all"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Main Status Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider ${statusColors[getDisplayStatus()]}`}>
                {getDisplayStatus()}
              </span>
              {status.isFinalized && (
                <span className="px-6 py-2 rounded-full bg-blue-600/20 text-blue-200 font-bold text-sm uppercase tracking-wider">
                  ✓ Finalized
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-slate-300 font-bold">Overall Progress</p>
                <p className="text-white font-black text-lg">{progressPercentage}%</p>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-600/10 border border-green-600/20 rounded-2xl p-4 text-center">
                <p className="text-green-400 text-2xl font-black">{status.progress.verified}</p>
                <p className="text-slate-400 text-xs font-bold uppercase mt-1">Verified</p>
              </div>
              <div className="bg-amber-600/10 border border-amber-600/20 rounded-2xl p-4 text-center">
                <p className="text-amber-400 text-2xl font-black">{status.progress.pending}</p>
                <p className="text-slate-400 text-xs font-bold uppercase mt-1">Pending</p>
              </div>
              <div className="bg-red-600/10 border border-red-600/20 rounded-2xl p-4 text-center">
                <p className="text-red-400 text-2xl font-black">{status.progress.rejected}</p>
                <p className="text-slate-400 text-xs font-bold uppercase mt-1">Rejected</p>
              </div>
            </div>
          </div>

          {status.assignedAgent && (
            <div className="border-t border-white/10 pt-6">
              <div className="bg-white/5 rounded-2xl p-6">
                <p className="text-slate-400 text-xs font-bold uppercase mb-3">Assigned Agent</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                    <User className="text-indigo-400" size={24} />
                  </div>
                  <div>
                    <p className="text-white font-black">{status.assignedAgent.name}</p>
                    <p className="text-slate-400 text-sm">{status.assignedAgent.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-white/10 pt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">Submitted At</p>
              <p className="text-white font-bold">{new Date(status.submittedAt).toLocaleDateString()}</p>
              <p className="text-slate-500 text-sm">{new Date(status.submittedAt).toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">Last Updated</p>
              <p className="text-white font-bold">{new Date(status.updatedAt).toLocaleDateString()}</p>
              <p className="text-slate-500 text-sm">{new Date(status.updatedAt).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Document Status Details */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6 mb-8">
          <h3 className="text-white font-black text-xl mb-6">Document Verification Details</h3>

          <div className="space-y-3">
            {Object.entries(status.reviews).map(([docType, review]) => (
              <div
                key={docType}
                className={`bg-white/5 rounded-2xl p-5 border border-white/5 transition-all ${selectedDoc === docType ? 'ring-2 ring-indigo-600 bg-indigo-600/10' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(review.status)}
                    <div>
                      <p className="text-white font-bold capitalize">{docLabels[docType] || docType}</p>
                      {review.comment && (
                        <p className="text-slate-400 text-sm mt-1">{review.comment}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${review.status === REVIEW.VERIFIED ? 'bg-green-600/20 text-green-300' :
                    review.status === REVIEW.REJECTED ? 'bg-red-600/20 text-red-300' :
                      'bg-amber-600/20 text-amber-300'
                    }`}>
                    {REVIEW_LABELS[review.status] || 'Pending'}
                  </span>
                </div>

                {review.status === REVIEW.REJECTED && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => setSelectedDoc(selectedDoc === docType ? null : docType)}
                      className="text-indigo-400 text-sm font-bold hover:text-indigo-300 flex items-center gap-2"
                    >
                      <Upload size={16} /> Re-upload this document
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Re-upload Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-black text-xl">Re-upload Document</h3>
                <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-6">
                <div className="bg-red-600/10 border border-red-600/20 rounded-2xl p-4">
                  <p className="text-red-300 text-sm">
                    <strong>Document:</strong> {docLabels[selectedDoc] || selectedDoc}
                  </p>
                  <p className="text-slate-400 text-xs mt-2">{status.reviews[selectedDoc]?.comment}</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-3">Select New File</label>
                  <input
                    type="file"
                    onChange={(e) => setReuploadFile(e.target.files[0])}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white file:bg-indigo-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:cursor-pointer"
                  />
                  {reuploadFile && (
                    <p className="text-slate-400 text-sm mt-2">Selected: {reuploadFile.name}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="flex-1 bg-white/10 text-white px-4 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReupload}
                    disabled={uploading || !reuploadFile}
                    className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                    {uploading ? 'Uploading...' : 'Re-upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={handleBackToPortal}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
          >
            Back to Portal
          </button>
          {status.status === STATUS.VERIFIED && (
            <div className="bg-green-600/20 border border-green-600/50 text-green-300 px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
              <CheckCircle size={20} /> Verification Complete!
            </div>
          )}
          {rejectedDocs.length > 0 && status.status !== 'Verified' && (
            <div className="bg-yellow-600/20 border border-yellow-600/50 text-yellow-300 px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
              <AlertCircle size={20} /> {rejectedDocs.length} document(s) need re-upload
            </div>
          )}
        </div>
      </div>

      {/* Chat Hub */}
      <ChatHub currentUserId={userId} currentUserRole={ROLES.CANDIDATE} />
    </div>
  );
};

export default CandidateStatus;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Phone, UserCheck, GraduationCap, Briefcase, CheckCircle,
  MapPin, Shield, LogOut, ChevronLeft, ChevronRight, FileCheck, Loader2, PenTool, FileText, ArrowRight, Info, ExternalLink, Smartphone, Building, Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { STATUS } from '../constants';

const HybridField = ({ label, dbValue, fileKey, subLabel, files, setFiles, autoLabel, required }) => (
  <div className={`p-6 rounded-[32px] border-2 transition-all duration-500 group ${dbValue ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
    }`}>
    <div className="flex justify-between items-start mb-4">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">{label} {required && !dbValue && <span className="text-red-500">*</span>}</label>
      {dbValue && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-white border border-indigo-100 px-3 py-1 rounded-full shadow-sm">
          <CheckCircle size={12} className="text-indigo-500 fill-indigo-200/50" /> {autoLabel || 'AUTO-FETCHED'}
        </div>
      )}
    </div>

    {dbValue ? (
      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-800 text-lg">{dbValue}</p>
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
          <FileCheck size={16} />
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] text-amber-600 font-bold uppercase">
          <Info size={12} /> {subLabel}
        </div>
        <div className="relative">
          {files[fileKey] ? (
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl animate-in fade-in zoom-in">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="text-indigo-600 flex-shrink-0" size={20} />
                <span className="text-xs font-bold text-slate-700 truncate">{files[fileKey].name}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(URL.createObjectURL(files[fileKey]), '_blank')}
                  className="p-2 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors"
                  title="View File"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => {
                    const newFiles = { ...files };
                    delete newFiles[fileKey];
                    setFiles(newFiles);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg text-red-500 transition-colors"
                  title="Change File"
                >
                  <PenTool size={16} />
                </button>
              </div>
            </div>
          ) : (
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFiles({ ...files, [fileKey]: e.target.files[0] });
                }
              }}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-2xl file:border-0 file:text-xs file:font-bold file:bg-slate-950 file:text-white hover:file:bg-indigo-600 cursor-pointer transition-all"
            />
          )}
        </div>
      </div>
    )}
  </div>
);

const CandidatePortal = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isFresher, setIsFresher] = useState(false);
  const [autoData, setAutoData] = useState(null);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [assignedAgentName, setAssignedAgentName] = useState(null);
  const [candidateStatus, setCandidateStatus] = useState(null);

  // Professional details state
  const [profDetails, setProfDetails] = useState({
    previousCompany: '', previousDesignation: '', previousDuration: '',
    hrContactName: '', hrContactEmail: '', hrContactPhone: ''
  });

  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuth();
  const userId = user?.userId || user?.uid;

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/candidate/status/${userId}`);
        if (['Under Review', 'Verified', 'Rejected'].includes(res.data.status)) {
          setAssignedAgentName(res.data.assignedAgent);
          setCandidateStatus(res.data.status);
          setCurrentStep(6);
        } else if (res.data.isPhoneVerified) {
          setPhoneNumber(res.data.phoneNumber);
          handleAutoFetch(res.data.phoneNumber);
          setCurrentStep(1);
        }
      } catch (err) {
        console.error("Session check failed");
      }
    };
    if (userId) checkUserStatus();
  }, [userId]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) return alert("Please enter a valid phone number");
    const sanitizedPhone = phoneNumber.trim();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/send-otp', { phoneNumber: sanitizedPhone, userId });
      setOtpSent(true);
      alert("OTP Sent (Simulated). Check Server Console.");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/verify-otp', { phoneNumber: phoneNumber.trim(), otp: otp.trim(), userId });
      await checkAuth();
      await handleAutoFetch(phoneNumber.trim());
      setCurrentStep(1);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Invalid OTP";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (value) => {
    setPhoneNumber(value);
    // Reset OTP state when phone changes so user can re-request
    if (otpSent) {
      setOtpSent(false);
      setOtp('');
    }
  };

  const handleAutoFetch = async (phone) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/candidate/auto-fetch/${phone}`);
      setAutoData(res.data);
    } catch (err) {
      console.log("No master records found");
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const aadharSatisfied = autoData?.aadharNumber || files.aadhar;
      const panSatisfied = autoData?.panNumber || files.pan;
      if (!aadharSatisfied || !panSatisfied) {
        return alert("Please ensure both Aadhaar and PAN details are provided.");
      }
    }

    if (currentStep === 2) {
      const tenthSatisfied = autoData?.tenthPercentage || files.tenth;
      const twelfthSatisfied = autoData?.twelfthPercentage || files.twelfth;
      const degreeSatisfied = autoData?.degreeGPA || files.degree;
      if (!tenthSatisfied || !twelfthSatisfied || !degreeSatisfied) {
        return alert("Please ensure all academic marksheets are provided.");
      }
    }

    if (currentStep === 3 && !isFresher) {
      if (!profDetails.previousCompany.trim()) return alert("Company Name is required.");
      if (!profDetails.previousDesignation.trim()) return alert("Designation is required.");
      if (!profDetails.previousDuration.trim()) return alert("Duration is required.");
      if (!profDetails.hrContactName.trim()) return alert("HR Contact Name is required.");
      if (!profDetails.hrContactEmail.trim()) return alert("HR Contact Email is required.");
      if (!profDetails.hrContactPhone.trim()) return alert("HR Contact Phone is required.");
      const expSatisfied = autoData?.experience || files.experience;
      if (!expSatisfied) {
        return alert("Please provide experience document or select 'I am a Fresher'.");
      }
    }

    setCurrentStep(prev => prev + 1);
  };
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const submitFinal = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('isFresher', isFresher);

    // Append professional details
    Object.keys(profDetails).forEach(key => {
      formData.append(key, profDetails[key]);
    });

    Object.keys(files).forEach(key => {
      if (files[key] && key !== 'consent') formData.append(key, files[key]);
    });

    try {
      const res = await axios.post('http://localhost:5000/api/candidate/upload-docs', formData);
      setAssignedAgentName(res.data.assignedAgent);
      setCurrentStep(6);
    } catch (err) {
      alert("Upload failed. Ensure server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-[56px] overflow-hidden border border-white">

          {/* PROGRESS HEADER */}
          <div className="bg-slate-950 px-10 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                <Shield size={24} />
              </div>
              <div>
                <span className="block font-black text-white text-lg tracking-widest uppercase">BGV</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">Security Portal</span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden lg:flex gap-2">
                {[0, 1, 2, 3, 4, 5].map(s => (
                  <div key={s} className={`w-10 h-1 text-xs rounded-full transition-all duration-500 ${currentStep >= s ? 'bg-indigo-600 w-16' : 'bg-slate-800'}`}></div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleLogout} className="group flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs transition-all uppercase tracking-widest bg-white/5 px-6 py-3 rounded-2xl">
                  <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> LOGOUT
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-16 lg:p-20">
            <div className="min-h-[500px]">

              {/* STAGE 0: PHONE VERIFICATION */}
              {currentStep === 0 && (
                <div className="max-w-xl mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                      <Smartphone size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Link Your Profile</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">Enter your registered mobile number to bridge your records from the BGV Database.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          className="w-full bg-slate-50 border-2 border-slate-100 p-6 pl-16 rounded-[32px] font-bold text-lg outline-none focus:border-indigo-600 transition-all"
                          value={phoneNumber}
                          onChange={e => handlePhoneChange(e.target.value)}
                        />
                      </div>
                    </div>

                    {otpSent && (
                      <div className="space-y-2 animate-in slide-in-from-top-4 duration-500">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">One Time Password</label>
                        <input
                          type="text"
                          placeholder="Enter 4-digit code"
                          className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-[32px] font-black text-center text-3xl tracking-[0.5em] outline-none focus:border-indigo-600 transition-all text-indigo-600"
                          maxLength="4"
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                        />
                      </div>
                    )}

                    {!otpSent ? (
                      <button
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full bg-slate-950 text-white p-6 rounded-[32px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-4"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : <>Request Secure Code <ArrowRight size={20} /></>}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <button
                          onClick={handleVerifyOtp}
                          disabled={loading || otp.length < 4}
                          className="w-full bg-indigo-600 text-white p-6 rounded-[32px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl flex items-center justify-center gap-4"
                        >
                          {loading ? <Loader2 className="animate-spin" /> : <>Verify & Bridge Records <CheckCircle size={20} /></>}
                        </button>
                        <button onClick={() => { setOtpSent(false); setOtp(''); }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all">Use Different Number</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STAGE 1: IDENTITY DOCUMENTS */}
              {currentStep === 1 && (
                <div className="space-y-12 animate-in slide-in-from-right-16 duration-700">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">Stage 01</div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">Identity Profile</h2>
                    <p className="text-slate-500 font-medium">Upload your identity documents. Matching records from the database will be auto-verified.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <HybridField
                      label="Aadhaar Card (UIDAI)"
                      dbValue={autoData?.aadharNumber ? `XXXX-XXXX-${autoData.aadharNumber.slice(-4)}` : null}
                      fileKey="aadhar" subLabel="Upload Aadhaar Scan (PDF/JPG)"
                      files={files} setFiles={setFiles} autoLabel="AUTO-VERIFIED" required
                    />
                    <HybridField
                      label="PAN Card (Tax Dept)"
                      dbValue={autoData?.panNumber}
                      fileKey="pan" subLabel="Upload PAN Card Scan (PDF/JPG)"
                      files={files} setFiles={setFiles} autoLabel="AUTO-VERIFIED" required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <HybridField
                      label="Address Proof"
                      dbValue={null}
                      fileKey="addressProof" subLabel="Utility Bill / Voter ID / Passport"
                      files={files} setFiles={setFiles}
                    />
                  </div>
                </div>
              )}

              {/* STAGE 2: ACADEMIC CREDENTIALS */}
              {currentStep === 2 && (
                <div className="space-y-12 animate-in slide-in-from-right-16 duration-700">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">Stage 02</div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">Academic Records</h2>
                    <p className="text-slate-500 font-medium">Educational records shown. All academic documents require manual verification by agent.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <HybridField label="10th Marksheet" dbValue={autoData?.tenthPercentage ? `${autoData.tenthPercentage}%` : null} fileKey="tenth" subLabel="Upload Class 10th PDF" files={files} setFiles={setFiles} autoLabel="AUTO-FETCHED" required />
                    <HybridField label="12th Marksheet" dbValue={autoData?.twelfthPercentage ? `${autoData.twelfthPercentage}%` : null} fileKey="twelfth" subLabel="Upload Class 12th PDF" files={files} setFiles={setFiles} autoLabel="AUTO-FETCHED" required />
                    <HybridField label="Bachelor's Degree" dbValue={autoData?.degreeGPA ? `${autoData.degreeGPA} CGPA` : null} fileKey="degree" subLabel="Upload Degree PDF" files={files} setFiles={setFiles} autoLabel="AUTO-FETCHED" required />
                  </div>
                </div>
              )}

              {/* STAGE 3: PROFESSIONAL HISTORY */}
              {currentStep === 3 && (
                <div className="space-y-12 animate-in slide-in-from-right-16 duration-700">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">Stage 03</div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">Career History</h2>

                    <label className="flex items-center gap-4 p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100 hover:border-indigo-600 transition-all cursor-pointer mt-4">
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded-lg accent-indigo-600"
                        checked={isFresher}
                        onChange={(e) => setIsFresher(e.target.checked)}
                      />
                      <div>
                        <p className="font-black text-slate-900 leading-none">I am a Fresher</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Skip professional document requirements</p>
                      </div>
                    </label>
                  </div>

                  {!isFresher && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                      {/* Previous employer details */}
                      <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Building className="text-indigo-600" size={20} />
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Previous Employment Details</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name <span className="text-red-500">*</span></label>
                            <input type="text" placeholder="e.g. TCS, Infosys" className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                              value={profDetails.previousCompany} onChange={e => setProfDetails({ ...profDetails, previousCompany: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation <span className="text-red-500">*</span></label>
                            <input type="text" placeholder="e.g. Software Engineer" className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                              value={profDetails.previousDesignation} onChange={e => setProfDetails({ ...profDetails, previousDesignation: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration <span className="text-red-500">*</span></label>
                            <input type="text" placeholder="e.g. 2 years" className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                              value={profDetails.previousDuration} onChange={e => setProfDetails({ ...profDetails, previousDuration: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      {/* HR Contact of previous company */}
                      <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="text-indigo-600" size={20} />
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Previous Company HR Contact</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HR Name <span className="text-red-500">*</span></label>
                            <input type="text" placeholder="HR Manager Name" className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                              value={profDetails.hrContactName} onChange={e => setProfDetails({ ...profDetails, hrContactName: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HR Email <span className="text-red-500">*</span></label>
                            <input type="email" placeholder="hr@company.com" className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                              value={profDetails.hrContactEmail} onChange={e => setProfDetails({ ...profDetails, hrContactEmail: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HR Phone <span className="text-red-500">*</span></label>
                            <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                              value={profDetails.hrContactPhone} onChange={e => setProfDetails({ ...profDetails, hrContactPhone: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <HybridField label="Experience Letter" dbValue={autoData?.experience} fileKey="experience" subLabel="Relieving / Service Certificate" files={files} setFiles={setFiles} required />
                        <HybridField label="Payslip" dbValue={autoData?.payslip} fileKey="payslip" subLabel="Last 3 Months Salary Slips" files={files} setFiles={setFiles} />
                        <HybridField label="Releasing Letter" dbValue={null} fileKey="releasingLetter" subLabel="Official Releasing Letter" files={files} setFiles={setFiles} required />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <HybridField label="Bank Statement" dbValue={null} fileKey="bankStatement" subLabel="Last 3 months statement" files={files} setFiles={setFiles} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 4: CONSENT & SIGNATURE */}
              {currentStep === 4 && (
                <div className="space-y-12 animate-in slide-in-from-right-16 duration-700">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">Stage 04</div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">Legal Authorization</h2>
                    <p className="text-slate-500 font-medium">Please provide your e-signature to authorize the screening.</p>
                  </div>

                  <div className="max-w-4xl mx-auto">
                    {!showPreview ? (
                      <div className="space-y-12 animate-in fade-in duration-700">
                        <div className="bg-slate-50 p-12 rounded-[56px] border-4 border-dashed border-slate-200 text-center hover:border-indigo-600 transition-all group relative">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={e => setFiles({ ...files, signature: e.target.files[0] })}
                          />
                          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-110 transition-transform">
                            <CheckCircle className="text-indigo-600" size={40} />
                          </div>
                          <h4 className="text-2xl font-black text-slate-900">Upload E-Signature</h4>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">White background PNG/JPG preferred</p>
                          {files.signature && (
                            <div className="mt-8 flex items-center justify-center gap-3 text-indigo-600 font-bold bg-indigo-50 py-3 px-6 rounded-2xl mx-auto w-fit">
                              <FileText size={18} /> {files.signature.name}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setShowPreview(true)}
                          disabled={!files.signature}
                          className="w-full bg-slate-950 text-white p-8 rounded-[32px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed group flex items-center justify-center gap-4 text-lg"
                        >
                          Generate Legal Document <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-12">
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                          <div className="bg-white p-12 md:p-20 rounded-[56px] shadow-2xl border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                              <Shield size={200} />
                            </div>

                            <div className="space-y-12 relative">
                              <div className="flex justify-between items-center border-b-2 border-slate-50 pb-8">
                                <h3 className="text-4xl font-black tracking-tighter uppercase italic">Authorization Letter</h3>
                                <p className="text-slate-400 font-bold text-sm tracking-widest">{new Date().toLocaleDateString()}</p>
                              </div>

                              <div className="space-y-8 text-base md:text-lg leading-relaxed text-slate-700">
                                <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-3xl font-sans mb-10">
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Candidate</p>
                                    <p className="font-bold text-slate-900">{user?.name || "Verified User"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Reference ID</p>
                                    <p className="font-bold text-slate-900">BGV-{Math.floor(Math.random() * 90000) + 10000}</p>
                                  </div>
                                </div>

                                <p className="text-justify font-medium italic">
                                  "I hereby grant full permission to BGV Platform and its authorized verification agents to conduct a comprehensive background screening. I declare that the electronic records fetched and manual documents uploaded are authentic and represent my genuine history."
                                </p>
                              </div>

                              <div className="mt-32 border-t-2 border-slate-100 pt-8 w-64 ml-auto text-center">
                                <div className="h-32 flex items-center justify-center mb-4">
                                  {files.signature && (
                                    <img
                                      src={URL.createObjectURL(files.signature)}
                                      alt="Signature"
                                      className="max-h-full max-w-full mix-blend-multiply brightness-75 contrast-125"
                                    />
                                  )}
                                </div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-t-2 border-slate-900 pt-3">Authorised Recipient Sign</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-12 bg-indigo-600 rounded-[56px] text-white space-y-8 shadow-2xl relative overflow-hidden">
                            <Shield className="absolute -right-12 -bottom-12 text-white/10" size={300} />
                            <h4 className="text-2xl font-black tracking-tight">Final Verification</h4>
                            <label className="flex items-center gap-6 cursor-pointer p-8 bg-white/10 rounded-[32px] hover:bg-white/20 transition-all border border-white/20">
                              <input
                                type="checkbox"
                                className="w-8 h-8 rounded-xl accent-indigo-500"
                                onChange={e => setFiles({ ...files, consent: e.target.checked })}
                              />
                              <span className="font-bold text-lg">I have reviewed the document and confirm all details are accurate</span>
                            </label>
                          </div>

                          <div className="flex flex-col md:flex-row gap-6">
                            <button onClick={() => setShowPreview(false)} className="flex-1 bg-slate-100 text-slate-600 p-8 rounded-[32px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Back to Edit</button>
                            <button
                              onClick={submitFinal}
                              disabled={!files.consent || loading}
                              className="flex-[2] bg-indigo-600 text-white p-8 rounded-[32px] font-black uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all disabled:opacity-20 shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 text-xl"
                            >
                              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>Submit Verification <CheckCircle size={24} /></>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUCCESS / FINAL STATUS STAGE */}
              {currentStep === 6 && (
                <div className="text-center py-20 px-8 space-y-12 animate-in zoom-in-95 duration-1000">
                  {candidateStatus === STATUS.VERIFIED ? (
                    <>
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse"></div>
                        <div className="bg-green-100 w-44 h-44 rounded-[64px] flex items-center justify-center mx-auto text-green-600 relative rotate-12 transition-transform hover:rotate-0 duration-500">
                          <CheckCircle size={80} className="fill-green-200/50" />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h2 className="text-6xl font-black text-green-700 tracking-tighter leading-none">Congratulations!</h2>
                        <div className="max-w-lg mx-auto p-10 bg-green-50 border-2 border-green-200 rounded-[48px] space-y-4">
                          <p className="text-green-800 font-black uppercase tracking-widest text-sm">✅ Verification Approved</p>
                          <p className="text-slate-600 text-lg font-medium leading-relaxed">
                            Your Background Verification has been <strong className="text-green-700">successfully completed and approved</strong>. All documents have been verified.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : candidateStatus === STATUS.REJECTED ? (
                    <>
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse"></div>
                        <div className="bg-red-100 w-44 h-44 rounded-[64px] flex items-center justify-center mx-auto text-red-600 relative rotate-12 transition-transform hover:rotate-0 duration-500">
                          <Shield size={80} />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h2 className="text-6xl font-black text-red-700 tracking-tighter leading-none">Verification Unsuccessful</h2>
                        <div className="max-w-lg mx-auto p-10 bg-red-50 border-2 border-red-200 rounded-[48px] space-y-4">
                          <p className="text-red-800 font-black uppercase tracking-widest text-sm">⚠ Case Rejected</p>
                          <p className="text-slate-600 text-lg font-medium leading-relaxed">
                            Unfortunately, your background verification <strong className="text-red-700">could not be completed successfully</strong>. Please contact your HR representative for more details.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse"></div>
                        <div className="bg-indigo-100 w-44 h-44 rounded-[64px] flex items-center justify-center mx-auto text-indigo-600 relative rotate-12 transition-transform hover:rotate-0 duration-500">
                          <CheckCircle size={80} className="fill-indigo-200/50" />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Under Review</h2>
                        <div className="max-w-lg mx-auto p-10 bg-indigo-50 border-2 border-indigo-100 rounded-[48px] space-y-4">
                          <p className="text-indigo-900 font-black uppercase tracking-widest text-sm">✓ Documents Received</p>
                          <p className="text-slate-600 text-lg font-medium leading-relaxed">
                            Your documents have been submitted and are being reviewed by our verification agent.
                          </p>
                          {assignedAgentName && (
                            <div className="pt-6 border-t border-indigo-200 mt-6 flex items-center justify-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                <UserCheck size={24} />
                              </div>
                              <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Case Assigned To</p>
                                <p className="text-xl font-black text-indigo-900">Agent {assignedAgentName}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate('/candidate-status')}
                      className="px-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      <FileCheck size={18} /> Track Progress
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-12 py-5 bg-slate-950 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200"
                    >
                      Exit Portal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC FOOTER NAVIGATION */}
          {currentStep >= 1 && currentStep < 6 && !showPreview && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-24 pt-12 border-t-2 border-slate-50 gap-8 px-20 pb-12">
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-4 text-slate-400 font-black text-sm uppercase tracking-[0.2em] hover:text-indigo-600 transition-all px-8 py-4 rounded-2xl"
                >
                  <ChevronLeft size={24} /> Previous Stage
                </button>
              ) : <div></div>}

              <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Secure Data Transmission <Shield size={14} />
              </div>

              {currentStep < 4 && (
                <button
                  onClick={nextStep}
                  className="group flex items-center gap-6 bg-slate-950 text-white px-16 py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-2xl shadow-slate-200 hover:-translate-y-1"
                >
                  Continue Stage <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform duration-500" />
                </button>
              )}
            </div>
          )}
        </div >
      </div >

      <p className="text-center mt-12 text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
        <Shield size={14} /> Encrypted by BGV Security Engine
      </p>
    </>
  );
};

export default CandidatePortal;
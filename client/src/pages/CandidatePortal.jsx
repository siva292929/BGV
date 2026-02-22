import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Phone, UserCheck, GraduationCap, Briefcase, CheckCircle, 
  MapPin, Shield, LogOut, ChevronLeft, ChevronRight, FileCheck, Loader2, PenTool, FileText
} from 'lucide-react';

const CandidatePortal = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [autoData, setAutoData] = useState(null);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  // --- PERSISTENCE: CHECK STATUS ON MOUNT ---
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/candidate/status/${userId}`);
        // If they already submitted or are verified, lock them to the success screen
        if (['Under Review', 'Verified', 'Rejected'].includes(res.data.status)) {
          setCurrentStep(6);
        } else if (res.data.isPhoneVerified) {
          // If phone is verified but docs aren't sent, start at ID Stage
          setPhoneNumber(res.data.phoneNumber);
          setCurrentStep(2);
        }
      } catch (err) {
        console.error("Session check failed");
      }
    };
    if (userId) checkUserStatus();
  }, [userId]);

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- NAVIGATION ---
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  // --- OTP VERIFICATION & AUTO-FETCH ---
  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/candidate/verify-otp', { 
        phoneNumber, otp, userId 
      });
      if (res.data.success) {
        setAutoData(res.data.autoFetchedData);
        setCurrentStep(2);
      }
    } catch (err) {
      alert("Verification Failed. Check OTP in server terminal.");
    } finally {
      setLoading(false);
    }
  };

  // --- FINAL SUBMISSION ---
  const submitFinal = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('userId', userId);
    
    // Append all manually uploaded files
    Object.keys(files).forEach(key => {
      if (files[key]) formData.append(key, files[key]);
    });

    try {
      await axios.post('http://localhost:5000/api/candidate/upload-docs', formData);
      setCurrentStep(6);
    } catch (err) {
      alert("Upload failed. Ensure server is running and 'uploads' folder exists.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * REUSABLE HYBRID FIELD COMPONENT
   * This is the core logic: If dbValue exists, show 'Verified'. Otherwise, show 'Upload'.
   */
  const HybridField = ({ label, dbValue, fileKey, subLabel }) => (
    <div className={`p-5 rounded-3xl border-2 transition-all duration-300 ${
      dbValue ? 'bg-green-50/50 border-green-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        {dbValue && (
          <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            <FileCheck size={10}/> AUTO-FETCHED
          </span>
        )}
      </div>
      
      {dbValue ? (
        <p className="font-bold text-slate-800 text-lg">{dbValue}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-amber-600 font-bold uppercase italic">Action Required: {subLabel}</p>
          <div className="relative">
            <input 
              type="file" 
              onChange={(e) => setFiles({ ...files, [fileKey]: e.target.files[0] })}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-indigo-600 file:text-white cursor-pointer" 
            />
            {files[fileKey] && <CheckCircle className="absolute right-2 top-2 text-green-500 animate-in zoom-in" size={16}/>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] rounded-[48px] overflow-hidden border border-slate-100">
        
        {/* TOP NAVIGATION BAR */}
        <div className="bg-slate-950 px-10 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <Shield size={20}/>
            </div>
            <span className="font-black text-white text-sm uppercase tracking-[0.3em]">DarwinTrace</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs transition-all tracking-widest">
            <LogOut size={16}/> LOGOUT
          </button>
        </div>

        <div className="p-10 md:p-16">
          {/* STEP PROGRESS TRACKER */}
          <div className="flex justify-between mb-20 px-4 md:px-20 relative">
             <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -z-0"></div>
             {[1, 2, 3, 4, 5].map(s => (
               <div key={s} className={`z-10 w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-700 border-2 ${
                 currentStep >= s ? 'bg-indigo-600 text-white border-indigo-600 scale-110 shadow-xl shadow-indigo-100' : 'bg-white text-slate-200 border-slate-100'
               }`}>
                 {currentStep > s ? <CheckCircle size={24}/> : s}
               </div>
             ))}
          </div>

          <div className="min-h-[400px]">
            {/* STAGE 1: OTP VERIFICATION */}
            {currentStep === 1 && (
              <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center">
                  <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Identity Link</h2>
                  <p className="text-slate-400 text-sm font-medium">Verify your registered mobile to sync your verified records.</p>
                </div>
                <div className="space-y-4">
                  <div className="group">
                    <input 
                      className="w-full border-2 border-slate-100 p-5 rounded-3xl outline-none focus:border-indigo-600 transition-all font-bold text-lg placeholder:text-slate-300" 
                      placeholder="Mobile Number" 
                      onChange={e => setPhoneNumber(e.target.value)} 
                    />
                    <button 
                      onClick={() => axios.post('http://localhost:5000/api/candidate/send-otp', {phoneNumber})} 
                      className="mt-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:text-indigo-800 transition-colors px-1"
                    >
                      Generate 6-Digit Code
                    </button>
                  </div>
                  <input 
                    className="w-full border-2 border-slate-100 p-5 rounded-3xl text-center text-4xl font-black tracking-[0.6em] focus:border-indigo-600 outline-none transition-all placeholder:text-slate-100" 
                    maxLength={6} 
                    placeholder="000000" 
                    onChange={e => setOtp(e.target.value)} 
                  />
                  <button 
                    onClick={handleVerify} 
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white p-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex justify-center items-center"
                  >
                    {loading ? <Loader2 className="animate-spin"/> : "Initiate Auto-Fetch"}
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: IDENTITY DOCUMENTS */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><UserCheck size={32}/></div>
                  <h2 className="text-3xl font-black tracking-tight">Stage 1: Identity Profile</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <HybridField 
                    label="Aadhaar Card (UIDAI)" 
                    dbValue={autoData?.aadharNumber ? `XXXX-XXXX-${autoData.aadharNumber.slice(-4)}` : null} 
                    fileKey="aadhar" 
                    subLabel="Upload National ID Scan" 
                  />
                  <HybridField 
                    label="PAN Card (IT Dept)" 
                    dbValue={autoData?.panNumber} 
                    fileKey="pan" 
                    subLabel="Upload PAN Card Scan" 
                  />
                </div>
              </div>
            )}

            {/* STAGE 3: ACADEMIC CREDENTIALS */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><GraduationCap size={32}/></div>
                  <h2 className="text-3xl font-black tracking-tight">Stage 2: Academic Records</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <HybridField label="10th Marksheet" dbValue={autoData?.tenthPercentage} fileKey="tenth" subLabel="PDF Upload" />
                  <HybridField label="12th Marksheet" dbValue={autoData?.twelfthPercentage} fileKey="twelfth" subLabel="PDF Upload" />
                  <HybridField label="Bachelor's Degree" dbValue={autoData?.degreeGPA ? `${autoData.degreeGPA} GPA` : null} fileKey="degree" subLabel="Final Degree Upload" />
                </div>
              </div>
            )}

            {/* STAGE 4: PROFESSIONAL HISTORY */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><Briefcase size={32}/></div>
                  <h2 className="text-3xl font-black tracking-tight">Stage 3: Employment Records</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <HybridField label="Previous Experience" dbValue={autoData?.experience} fileKey="experience" subLabel="Relieving Letter (PDF)" />
                  <HybridField label="Proof of Salary" dbValue={autoData?.payslip} fileKey="payslip" subLabel="Last 3 Months Payslips" />
                </div>
              </div>
            )}

            {/* STAGE 5: SIGNATURE UPLOAD & PDF PREVIEW */}
            {currentStep === 5 && (
              <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><PenTool size={32}/></div>
                  <h2 className="text-3xl font-black tracking-tight">Stage 4: Digital Signature</h2>
                </div>
                
                {!showPreview ? (
                  <div className="grid grid-cols-1 gap-8">
                    <HybridField 
                      label="Your Signature Scan" 
                      dbValue={null} 
                      fileKey="signature" 
                      subLabel="Upload Sign (PNG/JPG with White Background)" 
                    />
                    
                    <button 
                      onClick={() => files.signature ? setShowPreview(true) : alert("Please upload your signature first")}
                      className="w-full bg-slate-950 text-white p-7 rounded-[32px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-xl"
                    >
                      Generate Document Preview
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* PDF SIMULATION BOX */}
                    <div className="bg-white border-[12px] border-slate-200 p-10 shadow-2xl rounded-sm min-h-[500px] relative font-serif text-slate-800">
                      <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-center">
                        <h3 className="text-2xl font-bold uppercase tracking-tighter">DarwinTrace Verification Consent</h3>
                        <FileText size={32} className="text-slate-300" />
                      </div>
                      
                      <div className="space-y-6 text-sm leading-relaxed">
                        <p><strong>Candidate Name:</strong> {autoData?.fullName || "Verified User"}</p>
                        <p><strong>Verification ID:</strong> BGV-{Math.floor(Math.random() * 90000) + 10000}</p>
                        
                        <p className="mt-8 text-justify">
                          I hereby authorize DarwinTrace and its authorized agents to verify the documents provided during this session. I declare that all academic, professional, and personal details submitted are true to the best of my knowledge.
                        </p>
                      </div>

                      {/* SIGNATURE PLACEMENT */}
                      <div className="mt-20 border-t border-slate-200 pt-4 w-48 ml-auto text-center">
                        <div className="h-24 flex items-center justify-center mb-2">
                          <img 
                            src={URL.createObjectURL(files.signature)} 
                            alt="Signature" 
                            className="max-h-full max-w-full mix-blend-multiply" 
                          />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-900 pt-2">Digital Signature</p>
                      </div>
                    </div>

                    <div className="p-10 bg-indigo-600 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
                      <Shield className="absolute -right-8 -bottom-8 text-white/10" size={200}/>
                      <label className="flex items-center gap-4 cursor-pointer p-6 bg-white/10 rounded-3xl hover:bg-white/20 transition-all border border-white/20">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 accent-indigo-500" 
                          onChange={e => setFiles({...files, consent: e.target.checked})} 
                        />
                        <span className="font-bold text-sm">I verify the generated document above is correct</span>
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => setShowPreview(false)} className="flex-1 bg-slate-100 text-slate-600 p-6 rounded-[32px] font-black uppercase tracking-widest">Edit Signature</button>
                      <button 
                        onClick={submitFinal} 
                        disabled={!files.consent || loading}
                        className="flex-[2] bg-indigo-600 text-white p-6 rounded-[32px] font-black uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all disabled:opacity-20 shadow-2xl shadow-indigo-100"
                      >
                        {loading ? "Locking & Submitting..." : "Confirm & Submit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUCCESS STAGE */}
            {currentStep === 6 && (
              <div className="text-center py-20 space-y-8 animate-in zoom-in duration-700">
                <div className="bg-green-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner">
                  <CheckCircle size={64}/>
                </div>
                <div>
                  <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Application Locked</h2>
                  <p className="text-slate-400 max-w-sm mx-auto font-medium">Your verification case is now being processed. You can check your status by logging back in later.</p>
                </div>
                <button 
                  onClick={() => window.location.href = '/'} 
                  className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* DYNAMIC FOOTER NAVIGATION */}
          {currentStep > 1 && currentStep < 6 && !showPreview && (
            <div className="flex justify-between mt-20 pt-10 border-t border-slate-50">
              <button 
                onClick={prevStep} 
                className="flex items-center gap-3 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-all"
              >
                <ChevronLeft size={20}/> Previous Stage
              </button>
              
              {currentStep < 5 && (
                <button 
                  onClick={nextStep} 
                  className="group flex items-center gap-4 bg-slate-950 text-white px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  Continue <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidatePortal;
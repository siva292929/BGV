import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    ArrowRight,
    Fingerprint,
    Phone,
    FileCheck
} from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">

            {/* --- SIMPLE NAVIGATION --- */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5' : 'py-8 bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-2 shadow-xl">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">BGV <span className="text-indigo-500">TRUST</span></span>
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                    >
                        Sign In
                    </button>
                </div>
            </nav>

            {/* --- CLEAN HERO SECTION --- */}
            <section className="relative pt-48 pb-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-widest"
                    >
                        Next-Gen Verification Engine
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-bold tracking-tight leading-tight"
                    >
                        Verification Made <br /> <span className="text-indigo-500 font-extrabold italic">Simple.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed"
                    >
                        Standardized background checks, automated identity fetching, and secure reporting.
                        All in one professional platform built for speed and integrity.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="pt-4"
                    >
                        <button
                            onClick={() => navigate('/login')}
                            className="px-10 py-5 bg-white text-slate-950 hover:bg-indigo-50 rounded-2xl font-bold text-lg transition-all shadow-2xl active:scale-95 flex items-center gap-3"
                        >
                            Get Started <ArrowRight size={20} />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* --- ESSENTIAL FEATURES --- */}
            <section className="py-32 px-6 bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureItem
                            icon={Phone}
                            title="Instant Link"
                            desc="Secure Aadhaar/PAN verification with phone OTP."
                        />
                        <FeatureItem
                            icon={Fingerprint}
                            title="Hybrid Verify"
                            desc="Automated records combined with precision manual audits."
                        />
                        <FeatureItem
                            icon={FileCheck}
                            title="Finalized Trust"
                            desc="Digital reporting with full transparency and compliance."
                        />
                    </div>
                </div>
            </section>

            {/* --- SIMPLE FOOTER --- */}
            <footer className="py-20 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center p-1.5 grayscale opacity-50">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-semibold tracking-tight uppercase tracking-[0.2em] text-[10px]">© 2026 BGV Platform</span>
                    </div>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Security</a>
                        <a href="#" className="hover:text-white transition-colors">Compliance</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureItem = ({ icon: Icon, title, desc }) => (
    <div className="p-8 bg-slate-800/50 border border-white/5 rounded-3xl space-y-4 hover:border-indigo-500/30 transition-all">
        <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center">
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

export default Home;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Zap, BarChart3, Users } from 'lucide-react';

export function LandingPage() {
  const { user, signInAnonymously } = useAuth();
  const navigate = useNavigate();

  const handleStart = async () => {
    if (user) {
      navigate('/dashboard');
    } else {
      try {
        await signInAnonymously();
        navigate('/dashboard');
      } catch (err) {
        navigate('/signup');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans scroll-smooth">
      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-semibold tracking-tighter text-xl">
          <div className="h-6 w-6 bg-black flex items-center justify-center rounded-sm">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          ProtoLens
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => navigate(user ? '/dashboard' : '/login')} className="font-medium">
            {user ? 'Dashboard' : 'Sign In'}
          </Button>
          {!user && (
            <Button onClick={() => navigate('/signup')} className="font-medium rounded-full px-6">
              Get Started
            </Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-32 pb-24 max-w-5xl mx-auto text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-medium tracking-tight leading-[1.05] mb-8"
        >
          Stop Guessing.<br />
          Know What’s Wrong<br />
          With Your Product.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          ProtoLens simulates real users, critiques your UX, validates market potential, 
          and tells you exactly what to improve next.
        </motion.p>
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <Button onClick={handleStart} size="lg" className="rounded-full px-10 h-14 text-base tracking-tight">
            Analyze Your Product <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* Social Proof / Logo Cloud (Subtle) */}
      <section className="py-12 border-y border-neutral-100 bg-neutral-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 flex justify-center items-center gap-16 grayscale opacity-30 invert">
          <span className="font-bold text-xl tracking-tighter">BETA TESTERS INC</span>
          <span className="font-bold text-xl tracking-tighter">UX STRATEGISTS</span>
          <span className="font-bold text-xl tracking-tighter">MARKET MINDS</span>
          <span className="font-bold text-xl tracking-tighter">PRODUCT LABS</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-8 max-w-7xl mx-auto grid md:grid-cols-3 gap-16">
        <div className="space-y-4">
          <div className="h-10 w-10 bg-neutral-100 rounded-sm flex items-center justify-center">
             <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-medium tracking-tight">Multimodal Analysis</h3>
          <p className="text-neutral-500 leading-relaxed">
            Upload screenshots, wireframes, or even record a walkthrough. 
            Our AI understands visuals, audio, and text simultaneously.
          </p>
        </div>
        <div className="space-y-4">
          <div className="h-10 w-10 bg-neutral-100 rounded-sm flex items-center justify-center">
             <Users className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-medium tracking-tight">Beta User Simulation</h3>
          <p className="text-neutral-500 leading-relaxed">
            Get a first-person report of how a real user would feel landing on your page. 
            Identify drop-off risks before you build.
          </p>
        </div>
        <div className="space-y-4">
          <div className="h-10 w-10 bg-neutral-100 rounded-sm flex items-center justify-center">
             <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-medium tracking-tight">Market Validation</h3>
          <p className="text-neutral-500 leading-relaxed">
            Validate the originality and market demand. Know if you're building a 
            unique solution or entry into an oversaturated market.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-neutral-100 text-center text-neutral-400 text-sm">
        <div className="flex items-center justify-center gap-2 font-semibold tracking-tighter text-black mb-4">
          <div className="h-4 w-4 bg-black flex items-center justify-center rounded-sm">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          ProtoLens
        </div>
        <p>© 2026 ProtoLens. Built for product thinkers.</p>
      </footer>
    </div>
  );
}

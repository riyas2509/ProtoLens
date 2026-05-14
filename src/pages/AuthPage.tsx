import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Zap, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AuthPage() {
  const location = useLocation();
  const isSignUp = location.pathname === '/signup';
  const { login, loginWithEmail, signupWithEmail, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isEmailFormOpen, setIsEmailFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setError(null);
      await login();
      navigate('/dashboard');
    } catch (err: any) {
      setError("Failed to authenticate with Google. Please try again.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      if (isSignUp) {
        await signupWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestAuth = async () => {
    try {
      setError(null);
      await signInAnonymously();
      navigate('/dashboard');
    } catch (err: any) {
      setError("Guest sign-in failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <NavLink 
        to="/" 
        className="absolute top-12 left-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </NavLink>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="h-10 w-10 bg-black flex items-center justify-center rounded-sm mx-auto mb-6">
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-neutral-500 text-sm">
            {isSignUp 
              ? 'Join 2,000+ product thinkers using intelligence to build better.' 
              : 'Sign in to access your intelligence vault.'}
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleGoogleAuth}
            className="w-full h-12 bg-white text-black border border-neutral-200 hover:bg-neutral-50 rounded-lg flex items-center justify-center gap-3 transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-100"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-white px-4 text-neutral-300">or use email</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isEmailFormOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button 
                  variant="outline"
                  onClick={() => setIsEmailFormOpen(true)}
                  className="w-full h-12 border-neutral-200 text-neutral-600 flex items-center justify-center gap-3"
                >
                  <Mail className="h-4 w-4" />
                  Continue with Email
                </Button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleEmailAuth}
                className="space-y-3 overflow-hidden"
              >
                {isSignUp && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-black text-white hover:bg-neutral-800 rounded-lg transition-all"
                >
                  {isSubmitting ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </Button>
                <button 
                  type="button"
                  onClick={() => setIsEmailFormOpen(false)}
                  className="w-full text-[10px] uppercase font-bold tracking-widest text-neutral-400 hover:text-black py-2"
                >
                  Cancel
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="text-center space-y-4">
          <p className="text-sm text-neutral-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <NavLink 
              to={isSignUp ? '/login' : '/signup'} 
              className="text-black font-semibold hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Start for free'}
            </NavLink>
          </p>

          <div className="pt-2">
            <button 
              onClick={handleGuestAuth}
              className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 hover:text-black transition-all"
            >
              Start for free - Continue as Guest
            </button>
          </div>
        </div>

        <footer className="pt-12 text-center">
          <div className="flex items-center justify-center gap-2 text-neutral-400 mb-2">
            <Zap className="h-3 w-3 fill-neutral-200" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Enterprise Grade AI</span>
          </div>
          <p className="text-[9px] text-neutral-300 px-6">
            By continuing, you agree to our Terms of Strategic Insight and Privacy Protocol.
          </p>
        </footer>
      </motion.div>
    </div>
  );
}

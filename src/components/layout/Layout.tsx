import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LayoutList, History, LogOut, PlusCircle, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-100 bg-white flex flex-col">
        <div className="p-8">
          <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tighter text-xl">
            <div className="h-6 w-6 bg-black flex items-center justify-center rounded-sm">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            ProtoLens
          </NavLink>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-sm transition-colors text-sm font-medium",
              isActive ? "bg-neutral-100 text-black" : "text-neutral-500 hover:text-black hover:bg-neutral-50"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            New Analysis
          </NavLink>
          <NavLink 
            to="/history" 
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-sm transition-colors text-sm font-medium",
              isActive ? "bg-neutral-100 text-black" : "text-neutral-500 hover:text-black hover:bg-neutral-50"
            )}
          >
            <History className="h-4 w-4" />
            History
          </NavLink>
        </nav>

        <div className="p-4 mt-auto border-t border-neutral-100">
          {profile && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200">
                <User className="h-4 w-4 text-neutral-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.displayName || 'User'}</p>
                <p className="text-xs text-neutral-400 truncate">{profile.email}</p>
              </div>
              <button onClick={handleLogout} className="text-neutral-400 hover:text-black transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

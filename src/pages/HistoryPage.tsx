import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Analysis } from '../types';
import { Card } from '../components/ui/Card';
import { formatDate } from '../lib/utils';
import { FileText, Trash2, ChevronRight, Loader2, AlertCircle, Search, Filter, SortAsc, Edit2, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AnimatePresence, motion } from 'motion/react';

export function HistoryPage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'status'>('createdAt');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (!user) return;

    let q = query(
      collection(db, 'analyses'),
      where('userId', '==', user.uid),
      where('isSaved', '==', true),
      orderBy(sortBy, sortBy === 'createdAt' ? 'desc' : 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Analysis));
      
      // Secondary filter in JS if needed, but Firestore can handle standard status filter
      if (filterStatus !== 'all') {
        data = data.filter(a => a.status === filterStatus);
      }
      
      setAnalyses(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'analyses');
    });

    return () => unsubscribe();
  }, [user, sortBy, filterStatus]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteDoc(doc(db, 'analyses', id));
        if (selectedAnalysis?.id === id) setSelectedAnalysis(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `analyses/${id}`);
      }
    }
  };

  const handleUpdateTitle = async (id: string) => {
    if (!newTitle.trim()) return;
    try {
      await updateDoc(doc(db, 'analyses', id), { title: newTitle });
      setEditingTitle(null);
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis({ ...selectedAnalysis, title: newTitle });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `analyses/${id}`);
    }
  };

  return (
    <Layout>
      <div className="flex h-full">
        {/* List */}
        <div className="w-full md:w-1/3 border-r border-neutral-100 flex flex-col bg-white">
          <div className="p-8 border-b border-neutral-100">
            <h2 className="text-2xl font-medium tracking-tight mb-4">Intelligence Vault</h2>
            
            <div className="flex flex-wrap gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-neutral-50 border border-neutral-100 rounded px-2 py-1 outline-none"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="status">Sort by Status</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-100 rounded px-2 py-1 outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-neutral-300" />
              </div>
            ) : analyses.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="h-12 w-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-neutral-300" />
                </div>
                <p className="text-sm text-neutral-400">No analyses found yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {analyses.map((analysis) => (
                  <div 
                    key={analysis.id}
                    onClick={() => setSelectedAnalysis(analysis)}
                    className={`p-6 cursor-pointer hover:bg-neutral-50 transition-colors group ${selectedAnalysis?.id === analysis.id ? 'bg-neutral-50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-sm ${
                         analysis.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-400'
                       }`}>
                         {analysis.status}
                       </span>
                       <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitle(analysis.id);
                              setNewTitle(analysis.title);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-black transition-all"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(analysis.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                       </div>
                    </div>
                    {editingTitle === analysis.id ? (
                      <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                        <input 
                          autoFocus
                          value={newTitle} 
                          onChange={e => setNewTitle(e.target.value)}
                          className="text-sm border border-neutral-200 rounded px-2 py-1 w-full outline-none"
                          onKeyDown={e => e.key === 'Enter' && handleUpdateTitle(analysis.id)}
                        />
                        <button onClick={() => handleUpdateTitle(analysis.id)} className="text-green-500">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-medium text-sm mb-1 truncate">{analysis.title}</h3>
                    )}
                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{formatDate(analysis.createdAt?.toDate?.() || new Date())}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View */}
        <div className="hidden md:block flex-1 bg-neutral-50/30 overflow-y-auto p-12">
          <AnimatePresence mode="wait">
            {!selectedAnalysis ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-neutral-300 text-center"
              >
                <div className="h-16 w-16 border-2 border-dashed border-neutral-200 rounded-full flex items-center justify-center mb-4">
                  <ChevronRight className="h-6 w-6" />
                </div>
                <p className="text-sm">Select an analysis to view deep insights.</p>
              </motion.div>
            ) : !selectedAnalysis.result ? (
               <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-neutral-500 text-center"
              >
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-sm">Analysis is still processing...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="data"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto space-y-12"
              >
                <header className="space-y-2">
                   <h1 className="text-4xl font-medium tracking-tight leading-tight">{selectedAnalysis.title}</h1>
                   <p className="text-neutral-400 text-sm tracking-widest uppercase">{formatDate(selectedAnalysis.createdAt?.toDate?.() || new Date())}</p>
                </header>

                <div className="bg-neutral-900 text-white p-8 rounded-lg shadow-xl relative overflow-hidden">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">Biggest Friction</p>
                  <p className="text-2xl font-serif italic font-medium leading-tight">“{selectedAnalysis.result.biggestFriction}”</p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Beta User Simulation</h3>
                  <div className="bg-white p-8 rounded-lg border border-neutral-100 font-serif italic text-lg leading-relaxed text-neutral-700 shadow-sm">
                    {selectedAnalysis.result.betaSimulation}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Critical Problems</h3>
                  <div className="space-y-4">
                    {selectedAnalysis.result.criticalProblems.map((problem, i) => (
                      <Card key={i} className="p-6 border-l-4 border-l-neutral-900">
                        <div className="flex items-center gap-2 mb-3">
                           <AlertCircle className="h-4 w-4 text-neutral-900" />
                           <span className="text-[10px] uppercase font-bold tracking-[0.2em]">{problem.priority} Priority</span>
                        </div>
                        <h4 className="font-medium text-lg mb-4">{problem.problem}</h4>
                        <div className="grid grid-cols-2 gap-8 text-sm">
                           <div>
                              <p className="text-neutral-400 uppercase font-semibold text-[9px] tracking-widest mb-2">Impact</p>
                              <p className="text-neutral-600 leading-relaxed">{problem.impact}</p>
                           </div>
                           <div>
                              <p className="text-neutral-400 uppercase font-semibold text-[9px] tracking-widest mb-2">Fix</p>
                              <p className="text-neutral-600 leading-relaxed">{problem.fix}</p>
                           </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Analysis } from '../types';
import { Card } from '../components/ui/Card';
import { formatDate, cn } from '../lib/utils';
import { AlertCircle, Users, CheckCircle2, Zap, ArrowRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'analyses', id));
        if (docSnap.exists()) {
          const data = docSnap.data() as Analysis;
          if (data.isPublic) {
            setAnalysis({ ...data, id: docSnap.id });
          } else {
            setError("This analysis is not shared publicly.");
          }
        } else {
          setError("Analysis not found.");
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, `analyses/${id}`);
        setError("Failed to load analysis.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-12 w-12 border-4 border-neutral-100 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !analysis || !analysis.result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-8">
        <h1 className="text-4xl font-medium tracking-tight mb-4">Oops.</h1>
        <p className="text-neutral-500 mb-8 max-w-md">{error || "The link you're looking for is either invalid or private."}</p>
        <NavLink to="/" className="flex items-center gap-2 text-sm font-medium hover:underline">
          <Home className="h-4 w-4" /> Back to ProtoLens
        </NavLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-32">
      <nav className="p-8 max-w-4xl mx-auto flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tighter text-xl">
          <div className="h-5 w-5 bg-black flex items-center justify-center rounded-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          ProtoLens
        </NavLink>
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 px-3 py-1 bg-white rounded-full border border-neutral-100">Public Report</span>
      </nav>

      <main className="max-w-4xl mx-auto px-8 space-y-16">
        <header className="space-y-4">
           <h1 className="text-5xl font-medium tracking-tight leading-tight">{analysis.title}</h1>
           <div className="flex items-center gap-4 text-neutral-400 text-xs font-medium uppercase tracking-widest">
              <span>{formatDate(analysis.createdAt?.toDate?.() || new Date())}</span>
              <span className="h-1 w-1 bg-neutral-200 rounded-full" />
              <span>By anonymous strategist</span>
           </div>
        </header>

        <div className="bg-neutral-900 text-white p-10 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <AlertCircle className="h-32 w-32" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">Biggest Friction</p>
          <p className="text-3xl font-serif italic font-medium leading-snug">“{analysis.result.biggestFriction}”</p>
        </div>

        <Section title="Beta User Simulation" icon={<Users className="h-4 w-4" />}>
           <div className="bg-white p-10 rounded-xl border border-neutral-100 font-serif italic text-xl leading-relaxed text-neutral-700 shadow-sm">
              <ReactMarkdown>{analysis.result.betaSimulation}</ReactMarkdown>
           </div>
        </Section>

        <Section title="What ProtoLens Understood" icon={<CheckCircle2 className="h-4 w-4" />}>
           <div className="prose prose-base max-w-none text-neutral-600">
              <ReactMarkdown>{analysis.result.understanding}</ReactMarkdown>
           </div>
        </Section>

        <div className="grid md:grid-cols-2 gap-8">
          <Section title="Critical Problems" icon={<AlertCircle className="h-4 w-4" />}>
            <div className="space-y-4">
              {analysis.result.criticalProblems.map((problem, i) => (
                <Card key={i} className="p-6 border-l-4 border-l-neutral-900 shadow-sm">
                  <div className="mb-3">
                    <span className={cn(
                      "text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm",
                      problem.priority === 'High' ? "bg-red-100 text-red-600" : "bg-neutral-100 text-neutral-600"
                    )}>
                      {problem.priority} Priority
                    </span>
                  </div>
                  <h4 className="font-medium text-base mb-3">{problem.problem}</h4>
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div>
                      <p className="text-neutral-400 uppercase font-bold text-[9px] tracking-widest mb-1">Impact</p>
                      <p className="text-neutral-600">{problem.impact}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 uppercase font-bold text-[9px] tracking-widest mb-1">Fix</p>
                      <p className="text-neutral-600">{problem.fix}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Section>

          <div className="space-y-12">
            <Section title="Market Validation" icon={<Zap className="h-4 w-4" />}>
               <div className="prose prose-sm max-w-none text-neutral-600">
                  <ReactMarkdown>{analysis.result.marketValidation}</ReactMarkdown>
               </div>
            </Section>
            
            <Section title="Next Actions" icon={<ArrowRight className="h-4 w-4" />}>
              <div className="space-y-2">
                {analysis.result.nextActions.map((action, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-neutral-100 text-sm font-medium">
                     <div className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                       {i + 1}
                     </div>
                     {action}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </main>
      
      <footer className="mt-32 border-t border-neutral-100 py-16 text-center">
         <p className="text-neutral-400 text-sm mb-6">Generated by AI Product Intelligence</p>
         <NavLink to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors">
            Get your own analysis <Zap className="h-4 w-4 fill-white" />
         </NavLink>
      </footer>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 bg-white rounded-sm border border-neutral-100 flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">{title}</h3>
      </div>
      {children}
    </div>
  );
}

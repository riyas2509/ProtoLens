import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyzeProduct } from '../services/gemini';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Layout } from '../components/layout/Layout';
import { 
  Upload, 
  Mic, 
  Video as VideoIcon, 
  Type as TextIcon, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  Zap,
  ArrowRight,
  Edit2,
  Check,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { AnalysisResult } from '../types';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export function Dashboard() {
  const { user } = useAuth();
  const [inputs, setInputs] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [analysisTitle, setAnalysisTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (event) => {
          setInputs(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            file: audioBlob,
            preview: event.target?.result as string,
            type: 'audio',
            mimeType: 'audio/webm'
          }]);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputs(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: event.target?.result as string,
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio',
          mimeType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeInput = (id: string) => {
    setInputs(prev => prev.filter(i => i.id !== id));
  };

  const handleAnalyze = async () => {
    if (!user) return;
    if (inputs.length === 0 && !description) {
      setError("Please provide at least one input.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);
    setIsSaved(false);
    setCurrentAnalysisId(null);
    setAnalysisTitle('');

    try {
      // 1. Create Firestore record
      let analysisRef;
      const initialTitle = description ? (description.length > 50 ? description.slice(0, 50) + '...' : description) : 'Untitled Analysis';
      try {
        analysisRef = await addDoc(collection(db, 'analyses'), {
          userId: user.uid,
          title: initialTitle,
          status: 'pending',
          isSaved: false,
          createdAt: serverTimestamp(),
          inputTypes: [...new Set(inputs.map(i => i.type)), description ? 'text' : null].filter(Boolean)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'analyses');
      }
      
      setCurrentAnalysisId(analysisRef.id);
      setAnalysisTitle(initialTitle);

      // 2. Run AI Analysis
      const analysisInputs = inputs.map(i => ({
        type: i.type,
        data: i.preview,
        mimeType: i.mimeType
      }));

      const aiResult = await analyzeProduct(analysisInputs, description);
      
      // 3. Update Firestore
      try {
        await updateDoc(doc(db, 'analyses', analysisRef.id), {
          result: aiResult,
          status: 'completed'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `analyses/${analysisRef.id}`);
      }

      setResult(aiResult);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze product. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!currentAnalysisId) return;
    try {
      await updateDoc(doc(db, 'analyses', currentAnalysisId), {
        isSaved: true
      });
      setIsSaved(true);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `analyses/${currentAnalysisId}`);
    }
  };

  const handleUpdateTitle = async () => {
    if (!currentAnalysisId || !analysisTitle.trim()) return;
    try {
      await updateDoc(doc(db, 'analyses', currentAnalysisId), { title: analysisTitle });
      setIsEditingTitle(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `analyses/${currentAnalysisId}`);
    }
  };

  return (
    <Layout>
      <div className="flex h-full flex-col lg:flex-row overflow-hidden">
        {/* Left: Input Panel */}
        <div className="w-full lg:w-1/2 p-8 overflow-y-auto border-r border-neutral-100 bg-white">
          <div className="max-w-xl mx-auto space-y-10">
            <div>
              <h2 className="text-2xl font-medium tracking-tight mb-2">Initialize Analysis</h2>
              <p className="text-neutral-500 text-sm">Upload screens, record walkthroughs, or describe your idea.</p>
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-100 rounded-lg p-10 text-center hover:border-neutral-200 transition-all cursor-pointer group bg-neutral-50/50"
              >
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept="image/*,video/*,audio/*"
                />
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="h-4 w-4 text-neutral-400" />
                </div>
                <p className="text-sm font-medium mb-1">Drag and drop assets</p>
                <p className="text-xs text-neutral-400">Screenshots, wireframes, walkthroughs</p>
              </div>

              {/* Audio Recorder */}
              <div className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-all",
                isRecording ? "bg-red-50 border-red-100 ring-2 ring-red-500/20" : "bg-neutral-50 border-neutral-100"
              )}>
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                    isRecording ? "bg-red-500 animate-pulse text-white" : "bg-white text-neutral-500 shadow-sm hover:text-black"
                  )}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-0.5">
                    {isRecording ? "Recording..." : "Voice Memo"}
                  </p>
                  <p className="text-sm font-medium">
                    {isRecording ? formatTime(recordingTime) : "Explain your idea verbally"}
                  </p>
                </div>
                {isRecording && <div className="flex gap-1 h-3 items-end">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1 bg-red-400 animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>}
              </div>
            </div>

            {/* Inputs List */}
            <AnimatePresence>
              {inputs.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {inputs.map((input) => (
                    <motion.div 
                      key={input.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative rounded-md overflow-hidden aspect-square border border-neutral-100 group"
                    >
                      {input.type === 'image' ? (
                        <img src={input.preview} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white">
                           {input.type === 'video' ? <VideoIcon className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                        </div>
                      )}
                      <button 
                        onClick={() => removeInput(input.id)}
                        className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Text Input */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                <TextIcon className="h-3 w-3" />
                Additional Context
              </div>
              <textarea 
                placeholder="Explain the core problem you're solving or target audience..."
                className="w-full min-h-[120px] p-4 rounded-lg bg-neutral-50 border border-neutral-100 focus:outline-none focus:border-neutral-300 transition-colors text-sm placeholder:text-neutral-300 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && (
               <div className="p-4 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
                 <AlertCircle className="h-4 w-4" />
                 {error}
               </div>
            )}

            <Button 
              onClick={handleAnalyze} 
              loading={analyzing} 
              className="w-full h-12 rounded-lg text-base"
              disabled={inputs.length === 0 && !description}
            >
              Analyze Product <Zap className="ml-2 h-4 w-4 fill-white" />
            </Button>
          </div>
        </div>

        {/* Right: Analysis Panel */}
        <div className="w-full lg:w-1/2 p-8 overflow-y-auto bg-neutral-50/30">
          <AnimatePresence mode="wait">
            {!result && !analyzing && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center opacity-30 px-12"
              >
                <div className="h-16 w-16 bg-neutral-200 rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-medium tracking-tight mb-2">Waiting for Input</h3>
                <p className="text-sm">ProtoLens intelligence will appear here once you initiate analysis.</p>
              </motion.div>
            )}

            {analyzing && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-6"
              >
                <div className="relative">
                  <div className="h-24 w-24 border-4 border-neutral-100 rounded-full" />
                  <div className="h-24 w-24 border-4 border-black border-t-transparent rounded-full animate-spin absolute inset-0" />
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-xl tracking-tighter">AI</div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium">ProtoLens is thinking...</p>
                  <p className="text-xs text-neutral-400">Simulating beta users and validating market...</p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div 
                key="result"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.2
                    }
                  }
                }}
                className="space-y-12 pb-24"
              >
                {/* Header & Title */}
                <motion.div 
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="flex items-center justify-between"
                >
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 flex-grow max-w-md">
                      <input 
                        autoFocus
                        value={analysisTitle}
                        onChange={(e) => setAnalysisTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                        className="text-2xl font-medium tracking-tight bg-transparent border-b border-neutral-300 outline-none w-full"
                      />
                      <Button size="icon" variant="ghost" onClick={handleUpdateTitle} className="h-8 w-8">
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 group">
                      <h1 className="text-2xl font-medium tracking-tight">{analysisTitle}</h1>
                      <button 
                        onClick={() => setIsEditingTitle(true)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-100 rounded"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-neutral-400" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAnalyze}
                      className="text-xs h-8 px-4 rounded-full"
                    >
                      Re-run
                    </Button>
                    {!isSaved ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSave}
                        className="text-xs h-8 px-4 rounded-full"
                      >
                        Save
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium bg-green-50 px-4 py-1 rounded-full border border-green-100">
                        <CheckCircle2 className="h-3 w-3" />
                        Saved
                      </div>
                    )}
                    <Button 
                      variant={isCopied ? "primary" : "outline"}
                      size="sm" 
                      onClick={() => {
                        const url = `${window.location.origin}/share/${currentAnalysisId}`;
                        navigator.clipboard.writeText(url);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                        if (currentAnalysisId) {
                          updateDoc(doc(db, 'analyses', currentAnalysisId), { isPublic: true });
                        }
                      }}
                      className={cn("text-xs h-8 px-4 rounded-full transition-all", isCopied && "bg-black text-white hover:bg-black")}
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Share2 className="h-3.5 w-3.5 mr-1" />}
                      {isCopied ? "Copied" : "Share"}
                    </Button>
                  </div>
                </motion.div>

                {/* Friction Highlight */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="bg-neutral-900 text-white p-8 rounded-lg shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <AlertCircle className="h-24 w-24" />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Biggest Friction</p>
                  </div>
                  <p className="text-2xl font-serif italic font-medium leading-tight">“{result.biggestFriction}”</p>
                </motion.div>

                {/* Main Content Sections */}
                <div className="space-y-12">
                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <Section title="What ProtoLens Understood" icon={<CheckCircle2 className="h-4 w-4" />}>
                       <div className="prose prose-sm max-w-none text-neutral-600">
                          <ReactMarkdown>{result.understanding}</ReactMarkdown>
                       </div>
                    </Section>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <Section title="Beta User Simulation" icon={<Users className="h-4 w-4" />}>
                       <div className="bg-white p-6 rounded-lg border border-neutral-100 font-serif italic text-lg leading-relaxed text-neutral-700">
                          <ReactMarkdown>{result.betaSimulation}</ReactMarkdown>
                       </div>
                    </Section>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <Section title="Critical Problems" icon={<AlertCircle className="h-4 w-4" />}>
                      <div className="space-y-4">
                        {result.criticalProblems.map((problem, i) => (
                          <Card key={i} className="p-5 border-l-4 border-l-neutral-900">
                            <div className="flex items-start justify-between mb-3">
                              <span className={cn(
                                "text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm",
                                problem.priority === 'High' ? "bg-red-100 text-red-600" : "bg-neutral-100 text-neutral-600"
                              )}>
                                {problem.priority} Priority
                              </span>
                            </div>
                            <h4 className="font-medium text-sm mb-2">{problem.problem}</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                 <p className="text-neutral-400 uppercase font-semibold text-[9px] tracking-widest mb-1">Impact</p>
                                 <p className="text-neutral-600">{problem.impact}</p>
                              </div>
                              <div>
                                 <p className="text-neutral-400 uppercase font-semibold text-[9px] tracking-widest mb-1">Fix</p>
                                 <p className="text-neutral-600">{problem.fix}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </Section>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <Section title="Market Validation" icon={<BarChart3 className="h-4 w-4" />}>
                       <div className="prose prose-sm max-w-none text-neutral-600">
                          <ReactMarkdown>{result.marketValidation}</ReactMarkdown>
                       </div>
                    </Section>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <Section title="Feasibility Analysis" icon={<ArrowRight className="h-4 w-4" />}>
                       <div className="prose prose-sm max-w-none text-neutral-600">
                          <ReactMarkdown>{result.feasibilityAnalysis}</ReactMarkdown>
                       </div>
                    </Section>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <Section title="What To Do Next" icon={<Plus className="h-4 w-4" />}>
                      <div className="space-y-2">
                        {result.nextActions.map((action, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-neutral-100 text-sm">
                             <div className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                               {i + 1}
                             </div>
                             {action}
                          </div>
                        ))}
                      </div>
                    </Section>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 bg-neutral-100 rounded-sm flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

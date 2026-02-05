import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  List, 
  AlertTriangle, 
  X, 
  User, 
  ShieldCheck, 
  Cloud,
  CloudOff,
  Maximize2,
  Lock,
  Check,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  BookOpen,
  Megaphone,
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { Question, StudentAnswer, StudentExamSession, ExamResult, TrueFalseStatement, MatchPair } from '../types.ts';
import { LOGO_URL } from '../constants.tsx';
import { supabase } from '../lib/supabase.ts';

// Added fontSizes array to fix "Cannot find name 'fontSizes'" errors
const fontSizes = ['text-sm', 'text-base', 'text-lg'];

interface StudentExamInterfaceProps {
  session: StudentExamSession;
  questions: Question[];
  schoolId: string;
  onFinish: (result: ExamResult) => void;
}

const StudentExamInterface: React.FC<StudentExamInterfaceProps> = ({ session, questions, schoolId, onFinish }) => {
  const STORAGE_KEY = `emes_exam_state_${session.student_id}_${session.session_id}`;
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [extraTime, setExtraTime] = useState(0); 
  const [showNav, setShowNav] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [violations, setViolations] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [proctorMsg, setProctorMsg] = useState<string | null>(null);
  const [lastReadMsg, setLastReadMsg] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);

  const currentQuestion = questions[currentIdx];

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  }, []);

  // 1. MONITOR KONEKSI
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addLog("Koneksi Internet Terhubung Kembali.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      addLog("Koneksi Internet Terputus (Mode Persistensi Lokal).");
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addLog]);

  // 2. REAL-TIME LISTENER (FAST PATH)
  useEffect(() => {
    if (!isOnline) return;

    const channel = supabase
      .channel(`exam_session_${session.session_id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'exam_sessions', 
        filter: `id=eq.${session.session_id}` 
      }, (payload) => {
        if (payload.new.announcement && payload.new.announcement !== lastReadMsg) {
          setProctorMsg(payload.new.announcement);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'exam_results',
        filter: `student_id=eq.${session.student_id}`
      }, (payload) => {
        if (payload.new.status === 'Diblokir') setIsBlocked(true);
        if (payload.new.extra_time !== undefined && payload.new.extra_time !== extraTime) {
           setExtraTime(payload.new.extra_time);
           addLog(`Waktu bertambah ${payload.new.extra_time} menit.`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, isOnline, addLog, extraTime, lastReadMsg]);

  // 3. KEAMANAN: Lockdown
  const requestFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      const forbidden = ['c', 'v', 'u', 'p', 's', 'r'];
      if ((e.ctrlKey || e.metaKey) && forbidden.includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) e.preventDefault();
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && !showSubmitModal && !isBlocked) {
        setViolations(prev => prev + 1);
        setShowViolationAlert(true);
        addLog("Keluar Layar Penuh.");
      }
    };

    const handleBlur = () => {
      if (!showSubmitModal && !isBlocked) {
        setViolations(prev => prev + 1);
        setShowViolationAlert(true);
        addLog("Pindah Tab.");
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [showSubmitModal, isBlocked, addLog]);

  // 4. LOAD PERSISTENCE (OFFLINE RECOVERY)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setCurrentIdx(parsed.currentIdx || 0);
        setViolations(parsed.violations || 0);
        setActivityLogs(parsed.logs || []);
        setExtraTime(parsed.extraTime || 0);
        setLastReadMsg(parsed.lastReadMsg || null);
      } catch (e) {}
    }

    const baseExpiry = new Date(session.expiry_time).getTime();
    const updateTimer = () => {
      const nowTs = new Date().getTime();
      const diff = Math.max(0, Math.floor((baseExpiry - nowTs) / 1000) + (extraTime * 60));
      setTimeLeft(diff);
      if (diff <= 0) processSubmission('Auto-Submit');
    };
    
    const timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(timerInterval);
  }, [session, STORAGE_KEY, extraTime]);

  // 5. SAVE PERSISTENCE LOCAL
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      answers, 
      currentIdx, 
      violations, 
      logs: activityLogs,
      extraTime,
      lastReadMsg
    }));
  }, [answers, currentIdx, violations, activityLogs, extraTime, lastReadMsg, STORAGE_KEY]);

  // 6. SYNC & RECONCILIATION ENGINE (RELIABLE PATH)
  const calculateResult = useCallback((status: any): ExamResult => {
    let totalScore = 0, totalMax = 0, correctCount = 0;
    
    questions.forEach(q => {
        totalMax += q.weight;
        const studentAnswerObj = answers[q.id];
        const ans = studentAnswerObj?.answer;

        if (ans === undefined || ans === null || (Array.isArray(ans) && ans.length === 0)) {
            return;
        }
        if (typeof ans === 'object' && !Array.isArray(ans) && Object.keys(ans).length === 0) {
            return;
        }

        let isCorrect = false;

        switch (q.type) {
            case 'pilihan_ganda':
                const correctLabel = q.options?.find(o => o.is_correct)?.label;
                if (correctLabel && ans === correctLabel) {
                    isCorrect = true;
                }
                break;

            case 'pilihan_ganda_kompleks':
                const correctLabels = q.options?.filter(o => o.is_correct).map(o => o.label).sort() || [];
                const studentLabels = Array.isArray(ans) ? [...ans].sort() : [];
                if (correctLabels.length > 0 && JSON.stringify(correctLabels) === JSON.stringify(studentLabels)) {
                    isCorrect = true;
                }
                break;

            case 'benar_salah':
                if (q.statements && typeof ans === 'object' && ans !== null && Object.keys(ans).length === q.statements.length) {
                    const allCorrect = q.statements.every((stmt: TrueFalseStatement) => (ans as any)[stmt.id] === stmt.is_true);
                    if (allCorrect) isCorrect = true;
                }
                break;
                
            case 'menjodohkan':
                if (q.matching_pairs && typeof ans === 'object' && ans !== null && Object.keys(ans).length === q.matching_pairs.length) {
                    const allMatched = q.matching_pairs.every((pair: MatchPair) => (ans as any)[pair.left_text] === pair.right_text);
                    if (allMatched) isCorrect = true;
                }
                break;
        }

        if (isCorrect) {
            totalScore += q.weight;
            correctCount++;
        }
    });
    
    const answeredCount = Object.values(answers).filter((a: StudentAnswer) => {
        if (a.answer === null || a.answer === undefined) return false;
        if (Array.isArray(a.answer) && a.answer.length === 0) return false;
        if (typeof a.answer === 'object' && !Array.isArray(a.answer) && Object.keys(a.answer).length === 0) return false;
        return true;
    }).length;

    const final_grade = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
    
    return {
      id: `res_${session.student_id}_${session.session_id}`,
      school_id: schoolId,
      session_id: session.session_id,
      schedule_id: session.schedule_id,
      session_name: session.session_name,
      student_id: session.student_id,
      student_name: session.student_name,
      nis: session.nis,
      start_time: session.login_time,
      end_time: new Date().toISOString(),
      total_questions: questions.length,
      answered: answeredCount,
      correct: correctCount,
      incorrect: answeredCount - correctCount,
      score: totalScore,
      max_score: totalMax,
      final_grade: final_grade,
      is_passed: final_grade >= session.passing_grade,
      answers: Object.values(answers),
      violations_count: violations,
      extra_time: extraTime,
      activity_logs: activityLogs,
      status: status
    };
  }, [answers, questions, schoolId, session, violations, extraTime, activityLogs]);

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (!isOnline || isBlocked) return;
      setIsSyncing(true);
      try {
        // A. PUSH: Kirim Jawaban & Logs
        const payload = calculateResult('Sedang Ujian');
        await supabase.from('exam_results').upsert(payload, { onConflict: 'id' });

        // B. PULL: Tarik Instruksi Proktor Terbaru (Jika real-time terlewat)
        const { data: sessData } = await supabase.from('exam_sessions').select('announcement, status').eq('id', session.session_id).single();
        if (sessData) {
          if (sessData.announcement && sessData.announcement !== lastReadMsg) setProctorMsg(sessData.announcement);
          if (sessData.status === 'Selesai') processSubmission('Auto-Submit');
        }

        const { data: resData } = await supabase.from('exam_results').select('status, extra_time').eq('id', payload.id).maybeSingle();
        if (resData) {
          if (resData.status === 'Diblokir') setIsBlocked(true);
          if (resData.extra_time !== undefined) setExtraTime(resData.extra_time);
        }

        setLastSyncTime(new Date());
      } catch (e) {
        // console.warn("Sync deferred due to network instability.");
      } finally {
        setIsSyncing(false);
      }
    }, 20000); 
    return () => clearInterval(syncInterval);
  }, [isOnline, calculateResult, isBlocked, session, lastReadMsg]);

  const processSubmission = (status: any) => {
    const result = calculateResult(status);
    onFinish(result);
  };

  const handleAnswerChange = (val: any) => {
    setAnswers(prev => {
        const currentAns = prev[currentQuestion.id]?.answer;
        let newAnswer = val;

        if (currentQuestion.type === 'pilihan_ganda_kompleks') {
            const currentArray = Array.isArray(currentAns) ? [...currentAns] : [];
            if (currentArray.includes(val)) {
                newAnswer = currentArray.filter(item => item !== val);
            } else {
                newAnswer = [...currentArray, val];
            }
        }
        
        return {
            ...prev,
            [currentQuestion.id]: {
                question_id: currentQuestion.id,
                answer: newAnswer,
                is_doubtful: prev[currentQuestion.id]?.is_doubtful || false,
                updated_at: new Date().toISOString()
            }
        }
    });
  };
  
  const getAnsweredCount = () => {
    return Object.values(answers).filter((a: StudentAnswer) => {
        if (a.answer === null || a.answer === undefined) return false;
        if (Array.isArray(a.answer) && a.answer.length === 0) return false;
        if (typeof a.answer === 'object' && !Array.isArray(a.answer) && Object.keys(a.answer).length === 0) return false;
        return true;
    }).length;
  };

  const handleSubmitClick = () => {
    const answeredCount = getAnsweredCount();
    if (answeredCount < questions.length) {
        setShowIncompleteModal(true);
    } else {
        setShowSubmitModal(true);
    }
  };

  if (isBlocked) {
    return (
      <div className="fixed inset-0 bg-red-950 z-[9999] flex flex-col items-center justify-center p-10 text-white text-center">
         <AlertOctagon size={120} className="mb-8 text-red-500 animate-pulse" />
         <h1 className="text-4xl font-black uppercase mb-4">AKSES DIBLOKIR</h1>
         <p className="textxl font-bold uppercase tracking-widest text-red-200 leading-relaxed">Sesi Anda telah dihentikan oleh proktor pengawas karena terdeteksi tindakan melanggar integritas sistem.</p>
         <button onClick={() => window.location.reload()} className="mt-12 px-10 py-4 bg-white text-red-900 font-black rounded-sm uppercase tracking-widest hover:bg-gray-100 transition-all">Muat Ulang Halaman</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F3F4F6] z-[2000] flex flex-col font-sans select-none overflow-hidden">
      <header className="h-16 bg-[#064E3B] text-white flex items-center justify-between px-6 shrink-0 shadow-xl z-50 border-b border-white/10">
        <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Logo" className="w-8 h-8 logo-inverse"/>
            <div className="hidden sm:block">
                <h1 className="text-xs font-black uppercase tracking-widest leading-none">CBT INTEGRITY ENGINE</h1>
                <p className="text-[9px] text-emerald-300 font-bold uppercase mt-1">
                   {isSyncing ? 'Synchronizing...' : lastSyncTime ? `Last Sync: ${lastSyncTime.toLocaleTimeString()}` : 'Initializing Persistence...'}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${isOnline ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'}`}>
                {isOnline ? <><Cloud size={12} /> Cloud Connected</> : <><CloudOff size={12} /> Working Offline</>}
            </div>
            <div className="h-10 w-px bg-white/10 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-black uppercase leading-tight">{session.student_name}</p>
                    <p className="text-[9px] text-emerald-300 font-bold uppercase">{session.nis}</p>
                </div>
                <div className="w-9 h-9 bg-emerald-800 rounded-full border border-emerald-700 flex items-center justify-center text-emerald-200">
                    <User size={18} />
                </div>
            </div>
        </div>
      </header>

      {!isOnline && (
        <div className="sticky top-16 z-40 flex items-center justify-center gap-2 bg-amber-500 py-2 text-white text-xs font-bold shadow-lg animate-pulse">
            <CloudOff size={16} /> ANDA SEDANG OFFLINE. JAWABAN ANDA TETAP DISIMPAN LOKAL.
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 flex flex-col items-center pb-24 scrollbar-hide">
        <div className="w-full max-w-7xl bg-white rounded-sm shadow-2xl flex flex-col border border-gray-300 overflow-hidden">
            <div className="p-4 md:px-8 border-b border-gray-200 bg-[#F9FAFB] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#064E3B] text-white rounded-sm flex flex-col items-center justify-center border-b-4 border-emerald-900 shadow-md">
                        <span className="text-[8px] font-black uppercase opacity-60">ITEM</span>
                        <span className="text-2xl font-black leading-none">{currentIdx + 1}</span>
                    </div>
                    <div>
                        <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Mata Pelajaran</h2>
                        <span className="px-3 py-1 bg-white text-gray-800 text-[10px] font-black rounded-sm border border-gray-300 uppercase shadow-sm">{currentQuestion.subject}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`px-6 py-2.5 rounded-sm border-2 flex items-center gap-4 shadow-sm transition-colors ${timeLeft < 300 ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 'bg-white border-gray-300 text-gray-700'}`}>
                        <Clock size={20} />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5">Sisa Waktu</span>
                          <span className="text-xl font-mono font-black leading-none">
                             {Math.floor(timeLeft / 60).toString().padStart(2,'0')}:{(timeLeft % 60).toString().padStart(2,'0')}
                          </span>
                        </div>
                    </div>
                    <button onClick={() => setShowNav(true)} className="h-10 px-5 bg-gray-800 text-white rounded-sm font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
                        <List size={16} /> Daftar Soal
                    </button>
                </div>
            </div>
            
            <div className="flex-1 p-6 md:p-12 lg:p-16 space-y-10 min-h-[450px]">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TIPE: {currentQuestion.type.replace('_',' ')}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-300 uppercase mr-1">Teks:</span>
                        {[0, 1, 2].map(v => (
                           <button key={v} onClick={() => setFontSize(v)} className={`w-7 h-7 rounded-sm font-black text-[10px] border-2 ${fontSize === v ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'}`}>{v+1}</button>
                        ))}
                    </div>
                </div>

                <div className={`editor-content variant-question leading-relaxed text-gray-800 ${fontSizes[fontSize]}`} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.question_text) }} />
                
                <div className="space-y-4 pt-10">
                   {['pilihan_ganda', 'pilihan_ganda_kompleks'].includes(currentQuestion.type) && currentQuestion.options?.map((opt) => {
                       const isSelected = currentQuestion.type === 'pilihan_ganda'
                           ? answers[currentQuestion.id]?.answer === opt.label
                           : Array.isArray(answers[currentQuestion.id]?.answer) && (answers[currentQuestion.id]?.answer as string[]).includes(opt.label);

                       return (
                         <button 
                           key={opt.label} 
                           onClick={() => handleAnswerChange(opt.label)} 
                           className={`w-full flex items-start gap-5 p-5 border-2 rounded-sm transition-all text-left group shadow-sm ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-400 bg-white'}`}
                         >
                            <div className={`shrink-0 w-9 h-9 rounded-sm border-2 flex items-center justify-center font-black text-lg transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:border-gray-400'}`}>{opt.label}</div>
                            <div className={`editor-content pt-1 font-bold text-gray-700 ${fontSizes[fontSize]}`} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.text) }} />
                         </button>
                       );
                   })}
                </div>
            </div>
            
            <div className="p-4 md:p-8 border-t border-gray-200 flex justify-between items-center bg-[#F9FAFB]">
                <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)} className="px-8 py-4 bg-white hover:bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-sm font-black text-xs uppercase tracking-widest flex items-center gap-3 disabled:opacity-30 transition-all">
                    <ChevronLeft size={20} /> Kembali
                </button>
                <button onClick={() => {
                   const curr = answers[currentQuestion.id];
                   setAnswers(prev => ({
                     ...prev,
                     [currentQuestion.id]: { ...curr, question_id: currentQuestion.id, is_doubtful: !curr?.is_doubtful, updated_at: new Date().toISOString() }
                   }));
                }} className={`px-10 py-4 rounded-sm font-black text-xs uppercase tracking-widest transition-all border-2 ${answers[currentQuestion.id]?.is_doubtful ? 'bg-amber-400 border-amber-500 text-black' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                    <AlertTriangle size={20} /> Ragu - Ragu
                </button>
                {currentIdx < questions.length - 1 ? (
                    <button onClick={() => setCurrentIdx(currentIdx + 1)} className="px-8 py-4 bg-[#064E3B] hover:bg-[#065F46] text-white rounded-sm font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg active:scale-95">
                        Berikutnya <ChevronRight size={20} />
                    </button>
                ) : (
                    <button onClick={handleSubmitClick} className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white rounded-sm font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95">
                        <Check size={20} /> SELESAI
                    </button>
                )}
            </div>
        </div>
      </main>

      {/* OVERLAYS */}
      {proctorMsg && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg border-t-8 border-amber-500 overflow-hidden animate-in slide-in-from-top-10 duration-500">
             <div className="p-8 text-center">
               <Megaphone size={64} className="mx-auto text-amber-500 mb-6" />
               <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">PENGUMUMAN PROKTOR</h3>
               <div className="mt-6 p-6 bg-amber-50 border border-amber-100 rounded-sm">
                  <p className="text-lg font-bold text-amber-900 leading-relaxed uppercase">{proctorMsg}</p>
               </div>
               <button onClick={() => { setLastReadMsg(proctorMsg); setProctorMsg(null); }} className="mt-10 w-full py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-sm hover:bg-black transition-all shadow-xl active:scale-95">
                  SAYA MENGERTI
               </button>
             </div>
           </div>
        </div>
      )}

      {showViolationAlert && !isBlocked && (
        <div className="fixed inset-0 z-[7000] bg-red-950/98 backdrop-blur-xl flex items-center justify-center p-6 text-center">
           <div className="bg-white rounded-sm p-12 max-w-lg w-full shadow-2xl border-t-8 border-red-600 animate-in slide-in-from-bottom-10 duration-500">
              <Lock size={64} className="mx-auto text-red-600 mb-8" />
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">LOG PELANGGARAN</h3>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-tight mb-8 leading-relaxed">Penyimpangan sistem terdeteksi (pindah tab atau keluar layar penuh). Sesi Anda telah dilaporkan ke Dashboard Proktor.</p>
              <div className="bg-red-50 p-4 border border-red-100 rounded-sm mb-8"><p className="text-red-600 text-2xl font-black uppercase">PELANGGARAN: {violations}</p></div>
              <button onClick={() => { setShowViolationAlert(false); requestFullscreen(); }} className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-sm shadow-xl hover:bg-red-700 transition-all active:scale-95">KEMBALI KE LAYAR PENUH</button>
           </div>
        </div>
      )}

      {showNav && (
        <aside className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setShowNav(false)}>
           <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-8 bg-[#064E3B] text-white flex items-center justify-between">
                 <h2 className="text-xl font-black uppercase tracking-widest">Daftar Soal</h2>
                 <button onClick={() => setShowNav(false)} className="p-2 hover:bg-white/10 rounded-sm border border-white/20"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-5 gap-3 content-start scrollbar-thin">
                 {questions.map((q, idx) => {
                   const ans = answers[q.id];
                   const isAnswered = ans && ans.answer !== null;
                   return (
                    <button key={q.id} onClick={() => { setCurrentIdx(idx); setShowNav(false); }}
                      className={`aspect-square rounded-sm border-2 font-black text-sm flex items-center justify-center transition-all ${
                        currentIdx === idx ? 'bg-emerald-700 border-emerald-900 text-white shadow-lg scale-110' : 
                        ans?.is_doubtful ? 'bg-amber-400 border-amber-500 text-black shadow-sm' : 
                        isAnswered ? 'bg-gray-800 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-400'
                      }`}>{idx + 1}</button>
                   );
                 })}
              </div>
           </div>
        </aside>
      )}

      {showIncompleteModal && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
           <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 border border-gray-300">
             <div className="p-10 text-center">
               <AlertTriangle size={56} className="mx-auto text-amber-500 mb-6" />
               <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Belum Selesai?</h3>
               <p className="text-sm text-gray-500 mt-4 leading-relaxed font-medium uppercase tracking-tight">
                  Anda baru menjawab <span className="text-amber-700 font-black">{getAnsweredCount()} dari {questions.length}</span> soal. Yakin ingin menyelesaikan ujian?
               </p>
               <div className="mt-10 grid grid-cols-2 gap-4">
                  <button onClick={() => setShowIncompleteModal(false)} className="py-4 bg-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-gray-200">KEMBALI MENGERJAKAN</button>
                  <button onClick={() => { setShowIncompleteModal(false); setShowSubmitModal(true); }} className="py-4 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-sm shadow-xl hover:bg-amber-600 active:scale-95 transition-all">YA, SELESAIKAN</button>
               </div>
             </div>
           </div>
        </div>
      )}

      {showSubmitModal && ( 
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
           <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 border border-gray-300">
             <div className="p-10 text-center">
               <CheckCircle2 size={56} className="mx-auto text-emerald-700 mb-6" />
               <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Kirim Jawaban?</h3>
               {/* FIX: Explicitly type 'a' to resolve 'Property 'answer' does not exist on type 'unknown'' */}
               <p className="text-sm text-gray-500 mt-4 leading-relaxed font-medium uppercase tracking-tight">Anda telah menjawab <span className="text-emerald-700 font-black">{getAnsweredCount()} dari {questions.length}</span> soal. Sesi ujian akan diakhiri dan hasil dikalkulasi otomatis.</p>
               <div className="mt-10 grid grid-cols-2 gap-4">
                  <button onClick={() => setShowSubmitModal(false)} className="py-4 bg-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-gray-200">BATAL</button>
                  <button onClick={() => processSubmission('Selesai')} className="py-4 bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-sm shadow-xl hover:bg-emerald-800 active:scale-95 transition-all">YA, KIRIM DATA</button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentExamInterface;

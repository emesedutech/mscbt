import React, { useState, useEffect, useMemo } from 'react';
import { STUDENT_MENU_ITEMS, SCHOOL_NAME, LOGO_URL } from '../constants.tsx';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import Breadcrumb from './Breadcrumb.tsx';
import StudentExamInterface from './StudentExamInterface.tsx';
import ExamResultView from './ExamResultView.tsx';
import { supabase } from '../lib/supabase.ts';
import { cbtDb } from '../db.ts';
import { 
  Calendar, 
  History, 
  Loader2, 
  PlayCircle, 
  Clock, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  DownloadCloud,
  CheckCircle,
  Database,
  ChevronRight,
  Monitor,
  User,
  GraduationCap,
  Hash,
  School,
  CloudOff,
  BookOpen
} from 'lucide-react';
import { ExamResult, StudentExamSession, Question, SchoolProfile } from '../types.ts';
import { shuffleArray } from '../lib/utils.ts';
import { useToast } from '../hooks/useToast.ts';

interface StudentPortalProps {
  user: any;
  onLogout: (path?: string, confirm?: boolean) => void;
  onNavigate: (path: string) => void;
}

const getStudentInitialPath = () => window.location.pathname;

const StudentPortal: React.FC<StudentPortalProps> = ({ user, onLogout, onNavigate }) => {
  const [activePath, setActivePath] = useState(getStudentInitialPath());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [schoolProfile, setSchoolProfile] = useState(null);
  
  const [sessions, setSessions] = useState([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [cachedBankIds, setCachedBankIds] = useState(new Set());

  const [currentExam, setCurrentExam] = useState(null);
  const [examResultData, setExamResultData] = useState(null);
  const toast = useToast();

  const syncPendingResults = async () => {
    const localResults: ExamResult[] = JSON.parse(localStorage.getItem(`emes_res_${user.id}`) || '[]');
    const pending = localResults.filter(r => !r.synced);

    if (pending.length > 0 && navigator.onLine) {
      setIsSyncing(true);
      try {
        const { error } = await supabase.from('exam_results').insert(pending.map(({ synced, ...rest }) => rest));
        if (error) throw error;

        const updatedLocalResults = localResults.map(r => pending.find(p => p.id === r.id) ? { ...r, synced: true } : r);
        localStorage.setItem(`emes_res_${user.id}`, JSON.stringify(updatedLocalResults));
        setResults(updatedLocalResults);
        toast.success(`${pending.length} hasil ujian berhasil disinkronkan.`);
      } catch (err: any) {
        toast.error(`Sinkronisasi hasil gagal: ${err.message}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    const handleStatusChange = () => {
      const onlineStatus = navigator.onLine;
      setIsOnline(onlineStatus);
      if (onlineStatus) {
        syncPendingResults();
      }
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    syncPendingResults();

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [user.id]);

  const loadPortalData = async () => {
    setIsLoading(true);
    try {
      const localSess = await cbtDb.getSchedules();
      const localResults = JSON.parse(localStorage.getItem(`emes_res_${user.id}`) || '[]');
      const localQuestions = await cbtDb.perform('questions', 'readonly', (s: any) => s.getAll());
      const cachedIds = new Set(localQuestions.map((q: any) => q.bank_id));
      
      setSessions((localSess || []) as any);
      setResults(localResults);
      setCachedBankIds(cachedIds || new Set());

      if (navigator.onLine) {
        await syncPendingResults(); 
        
        const { data: onlineProfile, error: profileError } = await supabase.from('school_profiles').select('*').eq('school_id', user.school_id).maybeSingle();
        if (profileError) throw profileError;
        if (onlineProfile) setSchoolProfile(onlineProfile as any);

        const { data: onlineSess, error: sessError } = await supabase.from('exam_sessions').select('*, pkg:exam_schedules(*)').neq('status', 'Disiapkan');
        if (sessError) throw sessError;

        const { data: onlineResults, error: resultsError } = await supabase.from('exam_results').select('*').eq('student_id', user.id);
        if (resultsError) throw resultsError;
        
        if (onlineSess) {
          const filtered = onlineSess.filter((s: any) => s.pkg?.level === user.kelas);
          setSessions((filtered || []) as any);
          await cbtDb.saveSchedules(filtered);
        }
        if (onlineResults) {
          const localUnsynced = localResults.filter((r: ExamResult) => !r.synced);
          const onlineIds = new Set(onlineResults.map(r => r.id));
          const merged = [
            ...onlineResults.map((r: any) => ({ ...r, synced: true })),
            ...localUnsynced.filter(r => !onlineIds.has(r.id))
          ];
          setResults(merged);
          localStorage.setItem(`emes_res_${user.id}`, JSON.stringify(merged));
        }
      }

      const activeState = localStorage.getItem(`emes_active_exam_${user.id}`);
      if (activeState) {
        setCurrentExam(JSON.parse(activeState));
      }

    } catch (err: any) {
      toast.error(`Gagal memuat data portal: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPortalData(); }, [user.id]);

  function prepareExamQuestions(rawQuestions: Question[], schedule: any) {
    const typePriority = ['pilihan_ganda', 'pilihan_ganda_kompleks', 'benar_salah', 'menjodohkan'];
    let finalQuestions: Question[] = [];
    
    typePriority.forEach(type => {
      let group = rawQuestions.filter(q => q.type === type);
      if (schedule.randomize_questions) group = shuffleArray(group);
      finalQuestions.push(...group);
    });

    if (schedule.randomize_options) {
      return finalQuestions.map(q => {
        if ((q.type === 'pilihan_ganda' || q.type === 'pilihan_ganda_kompleks') && q.options) {
          return { ...q, options: shuffleArray(q.options) };
        }
        return q;
      });
    }
    return finalQuestions;
  }

  const handleStartExam = async (item: any) => {
    if (!item.canStart) return;
    const rawQs = await cbtDb.getQuestionsByBankId(item.pkg.bank_id);
    const preparedQs = prepareExamQuestions(rawQs as any, item.pkg);
    const loginTime = new Date();
    const examData = {
      session: {
        student_id: user.id,
        student_name: user.nama,
        nis: user.nis,
        session_id: item.id,
        session_name: item.name,
        schedule_id: item.pkg.id,
        room_id: 'R01',
        login_time: loginTime.toISOString(),
        duration_minutes: item.pkg.duration,
        expiry_time: new Date(loginTime.getTime() + item.pkg.duration * 60000).toISOString(),
        passing_grade: item.pkg.passing_grade || 75
      },
      questions: preparedQs
    };
    localStorage.setItem(`emes_active_exam_${user.id}`, JSON.stringify(examData));
    setCurrentExam(examData as any);
  };

  const handleFinishExam = async (result: ExamResult) => {
    setIsSyncing(true);
    const resultToSave: ExamResult = { ...result, synced: false };
    
    const localResults: ExamResult[] = JSON.parse(localStorage.getItem(`emes_res_${user.id}`) || '[]');
    const updatedResults = [resultToSave, ...localResults];
    localStorage.setItem(`emes_res_${user.id}`, JSON.stringify(updatedResults));
    setResults(updatedResults);
    
    localStorage.removeItem(`emes_active_exam_${user.id}`);
    localStorage.removeItem(`emes_exam_state_${user.id}_${result.session_id}`);

    if (navigator.onLine) {
      try {
        const { synced, ...payload } = resultToSave;
        const { error } = await supabase.from('exam_results').insert([payload]);
        if (error) throw error;
        
        const finalResults = JSON.parse(localStorage.getItem(`emes_res_${user.id}`) || '[]');
        const resultIndex = finalResults.findIndex((r: any) => r.id === resultToSave.id);
        if (resultIndex > -1) {
          finalResults[resultIndex].synced = true;
          localStorage.setItem(`emes_res_${user.id}`, JSON.stringify(finalResults));
          setResults(finalResults);
        }
        toast.success("Hasil ujian berhasil dikirim ke server.");
      } catch (err: any) {
        toast.error(`Gagal sinkronisasi hasil: ${err.message}. Hasil tersimpan lokal.`);
      }
    } else {
      toast.info("Anda sedang offline. Hasil ujian disimpan lokal dan akan disinkronkan saat kembali online.");
    }
    
    setIsSyncing(false);
    setCurrentExam(null);
    setExamResultData(result as any);
  };

  const handleSyncBank = async (bankId: string) => {
    if (!isOnline) {
      toast.error("Tidak ada koneksi internet untuk mengunduh soal.");
      return;
    }
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('questions').select('*').eq('bank_id', bankId);
      if (error) throw error;
      if (data) {
        await cbtDb.saveQuestions(data);
        setCachedBankIds(prev => new Set(prev).add(bankId));
        toast.success("Bank soal berhasil diunduh ke perangkat.");
      }
    } catch (err: any) {
      toast.error(`Gagal mengunduh soal: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMassSync = async () => {
    if (!isOnline) {
      toast.error("Tidak ada koneksi internet untuk sinkronisasi massal.");
      return;
    }
    setIsSyncing(true);
    try {
      const bankIds = [...new Set(sessions.map((s: any) => s.pkg?.bank_id))].filter(Boolean);
      const { data, error } = await supabase.from('questions').select('*').in('bank_id', bankIds);
      if (error) throw error;
      if (data) {
        await cbtDb.saveQuestions(data);
        setCachedBankIds(new Set(data.map(q => q.bank_id)));
        toast.success("Semua soal yang relevan telah disinkronkan.");
      }
      await syncPendingResults();
    } catch (err: any) {
      toast.error(`Sinkronisasi massal gagal: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const examItems = useMemo(() => {
    return sessions.map((s: any) => {
      const pkg = s.pkg;
      const hasFinished = results.some((r: any) => r.session_id === s.id);
      const isSynced = cachedBankIds.has(pkg?.bank_id);
      const todayStr = now.toISOString().split('T')[0];
      const curMin = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      const smin = sh * 60 + sm;
      const emin = eh * 60 + em;

      let progressStatus = 'BELUM_DIMULAI';
      if (hasFinished) progressStatus = 'SELESAI';
      else if (s.date < todayStr || (s.date === todayStr && curMin > emin)) progressStatus = 'SELESAI';
      else if (s.date === todayStr && curMin >= smin && curMin <= emin) progressStatus = 'BERLANGSUNG';

      let canStart = false;
      let lockReason = "";
      if (hasFinished) lockReason = "Selesai";
      else if (!isSynced) lockReason = "Sinkronkan Soal";
      else if (s.date > todayStr || (s.date === todayStr && curMin < smin)) lockReason = `Mulai ${s.start_time}`;
      else if (s.date < todayStr || (s.date === todayStr && curMin > emin)) lockReason = "Waktu Habis";
      else canStart = true;

      return { ...s, progressStatus, canStart, lockReason, isSynced, pkg };
    });
  }, [sessions, results, now, cachedBankIds]);

  const handleNavigate = (path: string) => {
    setActivePath(path);
    setIsSidebarOpen(false);
    onNavigate(path);
  };

  function renderContent() {
    switch (activePath) {
        case '/riwayat-hasil':
            return (
                <div className="space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-tight">Riwayat Hasil Ujian</h2>
                    <div className="gov-table-container">
                        <table className="gov-table">
                            <thead>
                                <tr>
                                    <th>Nama Sesi</th>
                                    <th className="text-center">Nilai Akhir</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center">Waktu Submit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length > 0 ? results.map(r => (
                                    <tr key={r.id}>
                                        <td>{r.session_name}</td>
                                        <td className="text-center font-black text-lg">{r.final_grade.toFixed(1)}</td>
                                        <td className="text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.is_passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {r.is_passed ? 'LULUS' : 'REMEDIAL'}
                                            </span>
                                        </td>
                                        <td className="text-center text-xs text-gray-500">{new Date(r.end_time).toLocaleString('id-ID')}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="text-center py-10 text-gray-400">Belum ada riwayat ujian.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        case '/profil-user':
            return (
                <div className="gov-card p-8 max-w-lg">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-6">Profil Peserta</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3"><span className="text-sm text-gray-500">Nama Lengkap</span><span className="col-span-2 font-bold text-gray-800">: {user.nama}</span></div>
                        <div className="grid grid-cols-3"><span className="text-sm text-gray-500">NIS</span><span className="col-span-2 font-bold text-gray-800">: {user.nis}</span></div>
                        <div className="grid grid-cols-3"><span className="text-sm text-gray-500">Kelas</span><span className="col-span-2 font-bold text-gray-800">: {user.kelas}</span></div>
                        <div className="grid grid-cols-3"><span className="text-sm text-gray-500">Rombel</span><span className="col-span-2 font-bold text-gray-800">: {user.rombel}</span></div>
                        <div className="grid grid-cols-3"><span className="text-sm text-gray-500">Username</span><span className="col-span-2 font-mono text-emerald-700">: {user.username}</span></div>
                    </div>
                </div>
            );
        default: // for '/' and '/jadwal-ujian-siswa'
            return (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black uppercase tracking-tight">Jadwal Ujian Aktif</h2>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-xs font-bold ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                      <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                    <button onClick={handleMassSync} disabled={isSyncing || !isOnline} className="gov-btn gov-btn-secondary text-xs flex items-center gap-2">
                      {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sinkronisasi Massal
                    </button>
                  </div>
                </div>
                {examItems.length > 0 ? (
                  examItems.map((item: any) => (
                    <div key={item.id} className={`p-4 rounded-md border flex items-center justify-between transition-all ${item.progressStatus === 'BERLANGSUNG' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-md flex items-center justify-center ${item.progressStatus === 'BERLANGSUNG' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{item.name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span>{item.pkg.subject}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {item.pkg.duration} menit</span>
                            <span className="flex items-center gap-1"><ShieldCheck size={12} /> {item.date} {item.start_time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!item.isSynced && (
                          <button onClick={() => handleSyncBank(item.pkg.bank_id)} disabled={isSyncing || !isOnline} className="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-md flex items-center gap-2">
                            <DownloadCloud size={14}/> {isSyncing ? 'Sync...' : 'Unduh Soal'}
                          </button>
                        )}
                        <button onClick={() => handleStartExam(item)} disabled={!item.canStart} className="px-6 py-2 text-sm font-bold bg-emerald-600 text-white rounded-md flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                          {item.canStart ? <><PlayCircle size={16}/> Mulai</> : <span>{item.lockReason}</span>}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-gray-400 bg-white rounded-md border">
                    <Calendar size={32} className="mx-auto mb-2" />
                    <p className="font-bold">Tidak ada jadwal ujian yang tersedia.</p>
                    <p className="text-sm mt-1">Silakan hubungi administrator.</p>
                  </div>
                )}
              </div>
            );
    }
}

  if (currentExam) return <StudentExamInterface session={(currentExam as any).session} questions={(currentExam as any).questions} onFinish={(res) => handleFinishExam(res)} schoolId={user.school_id} />;
  if (examResultData) return <ExamResultView result={examResultData} onExit={() => onLogout()} />;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={() => onLogout()} onNavigate={handleNavigate} user={user} schoolName={schoolProfile ? (schoolProfile as any).nama_sekolah : null} />
      <div className="flex flex-1 pt-20 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          isCollapsed={isSidebarCollapsed} 
          activePath={activePath} 
          menuItems={STUDENT_MENU_ITEMS} 
          onNavigate={handleNavigate} 
          onLogout={() => onLogout()} 
          onCloseMobile={() => setIsSidebarOpen(false)} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} overflow-hidden`}>
          <div className="hidden md:block shrink-0"><Breadcrumb items={[{ label: STUDENT_MENU_ITEMS.find(i => i.path === activePath)?.label || 'Beranda' }]} onNavigateHome={() => handleNavigate('/')} /></div>
          <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-hidden">
             {isLoading ? (
               <div className="h-full flex flex-col items-center justify-center gap-4">
                  <Loader2 size={40} className="animate-spin text-emerald-600 opacity-20"/>
                  <p className="text-xs font-semibold text-gray-400">Sinkronisasi Server...</p>
               </div>
             ) : renderContent()}
          </div>
          <footer className="shrink-0 py-4 px-10 text-center bg-gray-50">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Emes CBT &copy; {new Date().getFullYear()} Emes EduTech
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default StudentPortal;

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  ArrowLeft,
  Cloud,
  Loader2,
  Clock,
  ShieldCheck,
  RefreshCw,
  MoreVertical,
  Lock,
  AlertTriangle,
  Power,
  UserX,
  History,
  Megaphone,
  PlusCircle,
  Activity,
  Terminal,
  X
} from 'lucide-react';
import { 
  ExamSession, 
  ExamSchedule, 
  Student, 
  StudentMonitoringState, 
  ExamResult
} from '../types.ts';
import { supabase } from '../lib/supabase.ts';
import { useToast } from '../hooks/useToast.ts';

interface ExamMonitoringDashboardProps {
  session: ExamSession;
  pkg: ExamSchedule;
  students: Student[];
  results: ExamResult[];
  onBack: () => void;
  onUpdateStatus?: (sessionId: string, status: string) => void;
}

const ExamMonitoringDashboard: React.FC<ExamMonitoringDashboardProps> = ({ 
  session, 
  pkg, 
  students, 
  results: initialResults,
  onBack, 
  onUpdateStatus
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [localResults, setLocalResults] = useState<ExamResult[]>(initialResults);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();
  
  const [announcement, setAnnouncement] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [selectedStudentLogs, setSelectedStudentLogs] = useState<string[] | null>(null);

  const fetchLatestResults = async () => {
    setIsRefreshing(true);
    const { data } = await supabase.from('exam_results').select('*').eq('session_id', session.id);
    if (data) setLocalResults(data as ExamResult[]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(fetchLatestResults, 20000); 
    return () => clearInterval(interval);
  }, [session.id]);

  const handleBroadcast = async () => {
    if (!announcement.trim()) return;
    setIsSendingMsg(true);
    try {
      await supabase.from('exam_sessions').update({ announcement: announcement.trim() }).eq('id', session.id);
      toast.success("Pengumuman berhasil terkirim.");
      setAnnouncement('');
    } catch(e: any) {
      toast.error(`Gagal kirim: ${e.message}`);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleAddExtraTime = async (studentId: string) => {
    const minutesStr = prompt("Berapa menit tambahan waktu untuk siswa ini?");
    const minutes = parseInt(minutesStr || '0');
    if (!minutes || isNaN(minutes)) return;

    const res = localResults.find(r => r.student_id === studentId);
    if (res) {
      const { error } = await supabase.from('exam_results')
        .update({ 
          extra_time: (res.extra_time || 0) + minutes,
          activity_logs: [...(res.activity_logs || []), `[PROKTOR] Penambahan waktu ${minutes} menit pada ${new Date().toLocaleTimeString()}`]
        })
        .eq('id', res.id);
      
      if (!error) {
        toast.info(`Waktu tambahan ${minutes} menit diberikan.`);
        fetchLatestResults();
      } else {
        toast.error(`Gagal: ${error.message}`);
      }
    }
  };

  const handleBlockStudent = async (studentId: string) => {
    if (!window.confirm("YAKIN INGIN MEMBLOKIR SISWA? Siswa akan otomatis dikeluarkan dan tidak bisa login kembali ke sesi ini.")) return;
    const res = localResults.find(r => r.student_id === studentId);
    if (res) {
      const { error } = await supabase.from('exam_results')
        .update({ 
          status: 'Diblokir',
          activity_logs: [...(res.activity_logs || []), `[PROKTOR] Pemblokiran akses pada ${new Date().toLocaleTimeString()}`]
        })
        .eq('id', res.id);
        
      if (!error) {
        toast.success(`Siswa ${res.student_name} telah diblokir.`);
        fetchLatestResults();
      } else {
        toast.error(`Gagal blokir: ${error.message}`);
      }
    }
  };

  const monitoringData = useMemo(() => {
    const enrolledIds = new Set(session.rooms.flatMap(r => r.student_ids));
    const scheduledStudents = students.filter(s => enrolledIds.has(s.id));

    return scheduledStudents.map(s => {
      const result = localResults.find(r => r.student_id === s.id);
      let status: StudentMonitoringState['status'] = 'Belum Login';
      if (result) {
        if (result.status === 'Diblokir') status = 'Diblokir';
        else status = (result.status === 'Selesai' || result.status === 'Auto-Submit') ? 'Sudah Dikirim' : 'Sedang Ujian';
      }

      return {
        student_id: s.id, nis: s.nis, nama: s.nama, kelas: s.kelas, status: status,
        progress: result ? result.answered : 0, total_soal: pkg.question_count,
        login_time: result?.start_time, violations_count: result?.violations_count || 0,
        extra_time: result?.extra_time || 0, result_id: result?.id,
        activity_logs: result?.activity_logs || []
      } as any;
    });
  }, [session, pkg, students, localResults]);

  const filteredList = monitoringData.filter(d => {
    const matchSearch = (d.nama + d.nis).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'Semua' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-gray-800">
          <ArrowLeft size={14}/> Dashboard Sesi
        </button>
        <div className="flex gap-2">
          <button onClick={fetchLatestResults} disabled={isRefreshing} className="gov-btn bg-gray-50 border border-gray-300 text-gray-700 text-[10px]">
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'SYNC...' : 'SYNC'}
          </button>
          {session.status === 'Berlangsung' && (
             <button onClick={() => onUpdateStatus?.(session.id, 'Selesai')} className="gov-btn bg-red-600 text-white text-[10px]">
                <Power size={14}/> TUTUP SEMUA
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-1 space-y-6">
            <div className="gov-card p-6 border-t-4 border-amber-500">
               <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Megaphone size={16} className="text-amber-500" /> Broadcast Pesan
               </h3>
               <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} className="gov-input h-24 text-[11px] font-bold uppercase mb-4" placeholder="MASUKKAN PESAN UNTUK SELURUH PESERTA..." />
               <button disabled={isSendingMsg || !announcement} onClick={handleBroadcast} className="w-full py-3 bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-sm shadow-lg hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-50">
                 {isSendingMsg ? 'MENGIRIM...' : 'KIRIM PENGUMUMAN'}
               </button>
            </div>
            <div className="gov-card p-5 bg-[#022C22] text-white">
               <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">Live Session Info</p>
               <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-emerald-300">Waktu Mulai:</span><span className="text-[11px] font-black">{session.start_time}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-emerald-300">Durasi Paket:</span><span className="text-[11px] font-black">{pkg.duration} Menit</span></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-emerald-300">Total Soal:</span><span className="text-[11px] font-black">{pkg.question_count} Butir</span></div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-3 space-y-6">
            <div className="gov-card overflow-hidden">
               <div className="p-4 bg-gray-50 border-b flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input value={search} onChange={e => setSearch(e.target.value)} className="gov-input w-full pl-10 text-[10px] font-black uppercase" placeholder="FILTER NAMA ATAU NIS..." />
                  </div>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="gov-input w-48 text-[10px] font-black uppercase">
                     <option>Semua Status</option>
                     <option>Sedang Ujian</option>
                     <option>Sudah Dikirim</option>
                     <option>Diblokir</option>
                     <option>Belum Login</option>
                  </select>
               </div>
               <div className="overflow-x-auto">
                 <table className="gov-table">
                   <thead>
                     <tr>
                       <th className="w-12 text-center">No</th>
                       <th>Siswa & Koneksi</th>
                       <th className="text-center">Status</th>
                       <th className="text-center">Progres</th>
                       <th className="text-center">Keamanan</th>
                       <th className="text-right">Kontrol</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredList.map((d, idx) => (
                       <tr key={d.student_id} className="group hover:bg-gray-50 border-b last:border-0">
                         <td className="text-center text-xs font-bold text-gray-400">{idx + 1}</td>
                         <td className="py-4">
                           <div className="flex flex-col">
                             <span className="font-black text-gray-800 text-xs uppercase">{d.nama}</span>
                             <span className="text-[9px] text-gray-400 font-mono tracking-tighter">NIS: {d.nis} • {d.login_time ? 'ONLINE' : 'BELUM AKTIF'}</span>
                           </div>
                         </td>
                         <td className="text-center">
                           <span className={`px-2 py-0.5 rounded-sm border text-[8px] font-black uppercase tracking-widest ${ d.status === 'Sudah Dikirim' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : d.status === 'Sedang Ujian' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' : d.status === 'Diblokir' ? 'bg-red-600 text-white border-red-700' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                             {d.status}
                           </span>
                         </td>
                         <td className="text-center">
                           <div className="flex flex-col items-center gap-1">
                             <span className="text-[10px] font-black text-gray-700">{d.progress} / {d.total_soal}</span>
                             <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                               <div className="bg-emerald-600 h-full transition-all duration-1000" style={{ width: `${(d.progress/d.total_soal)*100}%` }}></div>
                             </div>
                           </div>
                         </td>
                         <td className="text-center">
                           {d.violations_count > 0 ? (
                             <button onClick={() => setSelectedStudentLogs(d.activity_logs)} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-sm text-[8px] font-black uppercase hover:bg-red-100">
                               <AlertTriangle size={10}/> {d.violations_count} Pelanggaran
                             </button>
                           ) : <span className="text-[9px] font-bold text-gray-300 uppercase italic">Clear</span> }
                         </td>
                         <td className="text-right">
                           <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all">
                             {d.status === 'Sedang Ujian' && (
                               <>
                                 <button onClick={() => handleAddExtraTime(d.student_id)} className="p-1.5 hover:bg-blue-50 text-blue-600 border border-transparent hover:border-blue-100" title="Beri Tambahan Waktu"><PlusCircle size={14}/></button>
                                 <button onClick={() => handleBlockStudent(d.student_id)} className="p-1.5 hover:bg-red-50 text-red-600 border border-transparent hover:border-red-100" title="Blokir Akses Siswa"><Lock size={14}/></button>
                                 <button onClick={() => setSelectedStudentLogs(d.activity_logs)} className="p-1.5 hover:bg-gray-100 text-gray-600" title="Lihat Log Audit"><Terminal size={14}/></button>
                               </>
                             )}
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
         </div>
      </div>
      {selectedStudentLogs && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg flex flex-col border border-gray-400 animate-in zoom-in duration-200">
              <div className="p-4 border-b bg-[#022C22] text-white flex items-center justify-between">
                 <div className="flex items-center gap-3"><Activity size={18} className="text-emerald-400" /><h3 className="text-sm font-black uppercase tracking-tight">Audit Log Aktivitas Teknis</h3></div>
                 <button onClick={() => setSelectedStudentLogs(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              <div className="p-6 bg-gray-50 flex-1 overflow-y-auto max-h-[400px] font-mono text-[10px]">
                 {selectedStudentLogs.length > 0 ? (
                   <div className="space-y-2">
                      {selectedStudentLogs.map((log, i) => (
                        <div key={i} className={`p-2 border-l-2 bg-white ${log.includes('PROKTOR') ? 'border-blue-500' : 'border-red-500'}`}>{log}</div>
                      ))}
                   </div>
                 ) : <div className="py-20 text-center text-gray-400 italic font-sans uppercase font-bold">Tidak ada log aktivitas mencurigakan.</div> }
              </div>
              <div className="p-4 border-t bg-gray-100 flex justify-end">
                 <button onClick={() => setSelectedStudentLogs(null)} className="px-10 py-2 bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest rounded-sm shadow-md">Tutup Audit</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExamMonitoringDashboard;

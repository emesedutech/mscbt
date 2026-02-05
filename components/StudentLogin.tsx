import React, { useState } from 'react';
import { Key, User, ArrowRight, ShieldAlert, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { ExamSession, ExamSchedule, Question, StudentExamSession } from '../types.ts';
import { LOGO_URL } from '../constants.tsx';
import { supabase } from '../lib/supabase.ts';

interface StudentLoginProps {
  onLoginSuccess: (session: StudentExamSession, questions: Question[]) => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onLoginSuccess }) => {
  const [nama, setNama] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isOnline = navigator.onLine;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data: sessions, error: sessionErr } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('status', 'Berlangsung');

      if (sessionErr || !sessions || sessions.length === 0) {
        throw new Error("Tidak ada sesi ujian AKTIF saat ini.");
      }

      let foundSession: ExamSession | undefined;
      let foundRoomId: string = '';

      for (const s of sessions) {
        const rooms = Array.isArray(s.rooms) ? s.rooms : JSON.parse(s.rooms || '[]');
        const room = rooms.find((r: any) => r.token.toUpperCase() === token.toUpperCase());
        if (room) {
          foundSession = s;
          foundRoomId = room.id;
          break;
        }
      }

      if (!foundSession) {
        throw new Error("Token Ujian tidak valid untuk ruangan mana pun.");
      }

      const { data: schedule, error: schErr } = await supabase
        .from('exam_schedules')
        .select('*')
        // FIX: Property 'scheduleId' does not exist on type 'ExamSession'. Did you mean 'schedule_id'?
        .eq('id', foundSession.schedule_id)
        .single();

      if (schErr || !schedule) throw new Error("Paket ujian tidak dapat dimuat.");

      const { data: sessionQuestions, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .eq('bank_id', schedule.bank_id);

      if (qErr || !sessionQuestions || sessionQuestions.length === 0) {
        throw new Error("Konten soal belum tersedia.");
      }

      const loginTime = new Date();
      const expiryTime = new Date(loginTime.getTime() + schedule.duration * 60000);
      
      // FIX: Added missing properties `nis`, `sessionName`, `passingGrade` to satisfy StudentExamSession type
      const studentId = `std_${Date.now()}`;
      // FIX: Changed property names to snake_case to match StudentExamSession type
      const studentSession: StudentExamSession = {
        student_id: studentId,
        student_name: nama.toUpperCase(),
        nis: studentId, // Use a unique ID for guest student NIS
        session_id: foundSession.id,
        session_name: foundSession.name,
        schedule_id: schedule.id,
        room_id: foundRoomId,
        login_time: loginTime.toISOString(),
        duration_minutes: schedule.duration,
        expiry_time: expiryTime.toISOString(),
        passing_grade: schedule.passing_grade,
      };

      // Meneruskan langsung tanpa simpan ke IndexedDB
      onLoginSuccess(studentSession, sessionQuestions);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#022c22] flex flex-col items-center justify-center p-6 gov-pattern-sidebar">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
           <img src={LOGO_URL} alt="Emes Logo" className="w-16 h-16 mx-auto mb-4 logo-inverse" />
           <h1 className="text-2xl font-black text-white uppercase tracking-widest">Emes CBT Portal</h1>
           <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Sistem Ujian Sekolah Cloud</p>
        </div>

        <div className="bg-white rounded-sm border-t-4 border-emerald-500 shadow-2xl overflow-hidden">
           <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                 {error && (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-sm flex items-center gap-3 text-red-700 animate-shake">
                      <ShieldAlert size={20} className="shrink-0" />
                      <p className="text-[10px] font-black uppercase leading-tight">{error}</p>
                   </div>
                 )}

                 <div className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Identitas Nama</label>
                       <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                          <input required type="text" value={nama} onChange={e => setNama(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-sm text-sm font-bold focus:border-emerald-500 outline-none" placeholder="NAMA LENGKAP" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Token Ruang</label>
                       <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                          <input required type="text" maxLength={10} value={token} onChange={e => setToken(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-sm text-lg font-mono font-black tracking-[0.2em] focus:border-emerald-500 outline-none text-emerald-800" placeholder="TOKEN" />
                       </div>
                    </div>
                 </div>

                 <button disabled={isLoading} type="submit" className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black uppercase text-xs tracking-[0.2em] rounded-sm shadow-xl flex items-center justify-center gap-3 disabled:opacity-70">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Masuk Sesi Ujian <ArrowRight size={18} /></>}
                 </button>
              </form>
           </div>
           <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 {isOnline ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-red-500" />}
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{isOnline ? 'CLOUD ACTIVE' : 'OFFLINE ERROR'}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
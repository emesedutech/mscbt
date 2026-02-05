
import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Search, 
  Clock, 
  MapPin, 
  Users, 
  Edit2, 
  Trash2, 
  Printer,
  ChevronRight,
  BookOpen,
  ChevronLeft,
  X,
  FileText,
  ClipboardCheck,
  UserSquare2
} from 'lucide-react';
import { ExamSession, ExamSchedule, ExamRoom } from '../types.ts';

interface ExamSessionHubProps {
  sessions: ExamSession[];
  packages: ExamSchedule[];
  roomsMaster: ExamRoom[];
  onAddSession: () => void;
  onEditSession: (s: ExamSession) => void;
  onDeleteSession: (s: ExamSession) => void;
  onPrintRequest: (type: 'BERITA_ACARA' | 'DAFTAR_HADIR' | 'KARTU', session: ExamSession, roomId: string) => void;
}

const ExamSessionHub: React.FC<ExamSessionHubProps> = ({ 
  sessions, 
  packages, 
  roomsMaster,
  onAddSession, 
  onEditSession, 
  onDeleteSession,
  onPrintRequest
}) => {
  const [viewTab, setViewTab] = useState<'kalender' | 'daftar'>('daftar');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [activePrintMenu, setActivePrintMenu] = useState<{ id: string, rect: DOMRect } | null>(null);
  const [roomSelectModal, setRoomSelectModal] = useState<{ session: ExamSession, type: 'BERITA_ACARA' | 'DAFTAR_HADIR' | 'KARTU' } | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateSessions, setSelectedDateSessions] = useState<{ date: string, items: ExamSession[] } | null>(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const pkg = packages.find(p => p.id === s.schedule_id);
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (pkg?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === '' || s.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [sessions, packages, search, filterStatus]);

  const StatusBadge = ({ status }: { status: ExamSession['status'] }) => {
    const colors = {
      'Disiapkan': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Berlangsung': 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
      'Selesai': 'bg-gray-50 text-gray-500 border-gray-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded-sm border text-[9px] font-black uppercase tracking-widest ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const calendarGrid = useMemo(() => {
    const days = [];
    const count = daysInMonth(currentMonth);
    const start = firstDayOfMonth(currentMonth);
    const prevMonthCount = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();

    for (let i = start - 1; i >= 0; i--) {
      days.push({ day: prevMonthCount - i, current: false });
    }
    for (let i = 1; i <= count; i++) {
      days.push({ day: i, current: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false });
    }
    return days;
  }, [currentMonth]);

  const getSessionsForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessions.filter(s => s.date === dateStr);
  };

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const activePrintSession = useMemo(() => {
    return sessions.find(s => s.id === activePrintMenu?.id);
  }, [sessions, activePrintMenu]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Pelaksanaan & Jadwal Sesi Ujian</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Konfigurasi waktu pengerjaan (Ruang/Peserta ditarik dari Profil Siswa)</p>
        </div>
        <button 
          onClick={onAddSession}
          className="px-6 py-2.5 bg-emerald-700 text-white rounded-sm font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-emerald-800 border border-emerald-900 shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} /> Buat Jadwal Sesi Baru
        </button>
      </div>

      <div className="flex items-center justify-between bg-white border border-gray-300 p-1 rounded-sm">
        <div className="flex gap-1">
          <button 
            onClick={() => setViewTab('daftar')}
            className={`px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewTab === 'daftar' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <List size={14} /> Tampilan Daftar
          </button>
          <button 
            onClick={() => setViewTab('kalender')}
            className={`px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewTab === 'kalender' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <CalendarIcon size={14} /> Kalender Bulanan
          </button>
        </div>
        
        {viewTab === 'daftar' && (
          <div className="flex items-center gap-2 pr-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="CARI SESI..." 
                className="gov-input pl-8 py-1.5 text-[10px] w-48 font-black uppercase" 
              />
            </div>
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="gov-input py-1.5 text-[10px] uppercase font-black"
            >
              <option value="">SEMUA STATUS</option>
              <option value="Disiapkan">DISIAPKAN</option>
              <option value="Berlangsung">BERLANGSUNG</option>
              <option value="Selesai">SELESAI</option>
            </select>
          </div>
        )}
      </div>

      {viewTab === 'daftar' ? (
        <div className="gov-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th className="w-12 text-center">No</th>
                <th>Waktu Pelaksanaan</th>
                <th>Nama Sesi & Paket Referensi</th>
                <th className="text-center">Mata Pelajaran</th>
                <th className="text-center">Target Kelas</th>
                <th className="text-center">Status</th>
                <th className="text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length > 0 ? filteredSessions.map((s, idx) => {
                const pkg = packages.find(p => p.id === s.schedule_id);
                const isPrinting = activePrintMenu?.id === s.id;
                
                return (
                  <tr key={s.id} className="relative">
                    <td className="text-center text-xs font-bold text-gray-500">{idx + 1}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-emerald-800 uppercase leading-none mb-1">{s.date}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                          <Clock size={10} /> {s.start_time} - {s.end_time}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 uppercase text-xs tracking-tight">{s.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-gray-400">
                          <BookOpen size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">DEF: {pkg?.name || 'ERR'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                       <span className="text-[10px] font-black text-gray-700 uppercase leading-none">{pkg?.subject}</span>
                    </td>
                    <td className="text-center">
                       <span className="text-[10px] font-black text-blue-700 uppercase">KELAS {pkg?.level}</span>
                    </td>
                    <td className="text-center">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActivePrintMenu(activePrintMenu?.id === s.id ? null : { id: s.id, rect });
                          }}
                          className={`p-1.5 border rounded-sm transition-all ${isPrinting ? 'bg-emerald-700 text-white border-emerald-800 shadow-inner' : 'border-gray-200 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50'}`} 
                          title="Menu Cetak Dokumen"
                        >
                          <Printer size={12} />
                        </button>

                        <button onClick={() => onEditSession(s)} className="p-1.5 border border-gray-200 rounded-sm hover:bg-gray-50 text-gray-400 hover:text-emerald-700" title="Edit Jadwal"><Edit2 size={12} /></button>
                        <button onClick={() => onDeleteSession(s)} className="p-1.5 border border-gray-200 rounded-sm hover:bg-red-50 text-gray-400 hover:text-red-700" title="Hapus"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="text-center py-24 bg-gray-50/30"><CalendarIcon size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Data Sesi Pelaksanaan Belum Ditemukan</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="gov-card p-6 bg-white shadow-sm border border-gray-200">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={20}/></button>
                   <h3 className="text-lg font-black uppercase tracking-tight w-48 text-center">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                   <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronRight size={20}/></button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                   <div className="w-3 h-3 bg-emerald-600 rounded-full"></div> Sesi Ujian Aktif
                </div>
             </div>

             <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-sm overflow-hidden">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                  <div key={d} className="bg-gray-50 p-2 text-center text-[10px] font-black uppercase text-gray-400">{d}</div>
                ))}
                {calendarGrid.map((cell, idx) => {
                  const daySessions = cell.current ? getSessionsForDate(cell.day) : [];
                  return (
                    <div 
                      key={idx} 
                      onClick={() => cell.current && daySessions.length > 0 && setSelectedDateSessions({ date: `${cell.day} ${monthNames[currentMonth.getMonth()]}`, items: daySessions })}
                      className={`min-h-[100px] p-2 bg-white flex flex-col group transition-all ${cell.current ? 'cursor-pointer hover:bg-emerald-50/30' : 'bg-gray-50/50 opacity-30 cursor-not-allowed'}`}
                    >
                      <span className={`text-[10px] font-black mb-1 ${cell.current ? 'text-gray-800' : 'text-gray-300'}`}>{cell.day}</span>
                      <div className="flex flex-col gap-1">
                        {daySessions.slice(0, 2).map(s => (
                          <div key={s.id} className="bg-emerald-600 text-white text-[8px] font-black uppercase p-1 rounded-sm truncate">
                            {s.start_time} - {s.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {activePrintMenu && activePrintSession && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActivePrintMenu(null)}></div>
          <div 
            style={{ 
              position: 'fixed', 
              top: `${activePrintMenu.rect.bottom + 4}px`, 
              left: `${activePrintMenu.rect.right - 208}px`,
              width: '208px'
            }}
            className="bg-white border border-gray-300 shadow-2xl z-[9999] rounded-sm py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50 mb-1">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Opsi Dokumen Resmi</p>
            </div>
            <button 
              onClick={() => { setRoomSelectModal({ session: activePrintSession, type: 'KARTU' }); setActivePrintMenu(null); }}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center gap-2 text-[10px] font-bold uppercase text-gray-700 transition-colors"
            >
              <UserSquare2 size={14} className="text-emerald-600" /> Cetak Kartu Peserta
            </button>
            <button 
              onClick={() => { setRoomSelectModal({ session: activePrintSession, type: 'BERITA_ACARA' }); setActivePrintMenu(null); }}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center gap-2 text-[10px] font-bold uppercase text-gray-700 transition-colors"
            >
              <FileText size={14} className="text-emerald-600" /> Cetak Berita Acara
            </button>
            <button 
              onClick={() => { setRoomSelectModal({ session: activePrintSession, type: 'DAFTAR_HADIR' }); setActivePrintMenu(null); }}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center gap-2 text-[10px] font-bold uppercase text-gray-700 transition-colors"
            >
              <ClipboardCheck size={14} className="text-emerald-600" /> Cetak Daftar Hadir
            </button>
          </div>
        </>
      )}

      {/* FIX: Replaced corrupted modal code with a functional implementation */}
      {roomSelectModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-sm shadow-2xl w-full max-w-md animate-in zoom-in duration-200 border border-gray-300">
              <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-tight">Pilih Ruang Ujian</h3>
                <button onClick={() => setRoomSelectModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20}/>
                </button>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-[10px] uppercase font-bold text-gray-500">Pilih salah satu ruang dari sesi <span className="text-emerald-700">{roomSelectModal.session.name}</span> untuk melanjutkan proses pencetakan dokumen.</p>
                {roomSelectModal.session.rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => {
                      onPrintRequest(roomSelectModal.type, roomSelectModal.session, room.id);
                      setRoomSelectModal(null);
                    }}
                    className="w-full text-left p-4 bg-white border border-gray-200 rounded-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{room.nama}</span>
                      <span className="text-xs text-gray-500">Kapasitas: {room.kapasitas} | Lokasi: {room.lokasi}</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400"/>
                  </button>
                ))}
              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end">
                <button onClick={() => setRoomSelectModal(null)} className="px-6 py-2 text-gray-600 font-black text-[10px] uppercase tracking-widest">
                  Batal
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExamSessionHub;

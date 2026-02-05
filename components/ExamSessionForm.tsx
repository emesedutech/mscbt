
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Save, 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  MapPin, 
  Clock,
  Calendar,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  Key,
  ShieldCheck,
  AlertTriangle,
  RefreshCcw,
  UserCheck,
  ArrowRight,
  Info,
  Search,
  X,
  Filter,
  Check
} from 'lucide-react';
import { 
  ExamSession, 
  ExamSchedule, 
  Teacher, 
  ExamRoom, 
  Student, 
  SessionRoom 
} from '../types.ts';

interface ExamSessionFormProps {
  initialData?: ExamSession;
  packages: ExamSchedule[];
  teachers: Teacher[];
  roomsMaster: ExamRoom[];
  students: Student[];
  onSave: (data: ExamSession) => void;
  onCancel: () => void;
}

const ExamSessionForm: React.FC<ExamSessionFormProps> = ({
  initialData,
  packages,
  teachers,
  roomsMaster,
  students,
  onSave,
  onCancel
}) => {
  const [step, setStep] = useState(1);
  const [roomCount, setRoomCount] = useState(initialData?.rooms.length || 1);
  const [formData, setFormData] = useState<Partial<ExamSession>>(initialData || {
    name: '',
    schedule_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '07:30',
    end_time: '',
    rooms: [],
    proctor_instructions: '1. Pastikan siswa login sesuai kartu.\n2. Awasi integritas ujian.\n3. Laporkan kendala teknis segera.',
    student_instructions: '1. Berdoa sebelum mengerjakan.\n2. Periksa kembali jawaban sebelum submit.',
    status: 'Disiapkan'
  });

  const [enrollmentModal, setEnrollmentModal] = useState<{ roomIndex: number } | null>(null);

  const selectedPkg = useMemo(() => packages.find(p => p.id === formData.schedule_id), [formData.schedule_id, packages]);
  const proctorsPool = useMemo(() => teachers.filter(t => t.jabatan === 'Guru Mapel' || t.jabatan === 'Kepala Sekolah' || t.jabatan === 'Wakil Kepala Sekolah'), [teachers]);
  const supervisorsPool = useMemo(() => teachers, [teachers]);
  
  // Pool siswa yang tersedia untuk level paket ini
  const availableStudentsPool = useMemo(() => {
    if (!selectedPkg) return [];
    return students.filter(s => s.kelas === selectedPkg.level && s.status === 'Aktif');
  }, [selectedPkg, students]);

  const generateToken = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  useEffect(() => {
    if (step === 2 && (!formData.rooms || formData.rooms.length === 0)) {
      handleRoomCountChange(1);
    }
  }, [step]);

  const handleRoomCountChange = (newCount: number) => {
    const val = Math.max(1, Math.min(50, newCount));
    setRoomCount(val);
    setFormData(prev => {
      const currentRooms = prev.rooms || [];
      if (val > currentRooms.length) {
        const newRooms: SessionRoom[] = [...currentRooms];
        for (let i = currentRooms.length; i < val; i++) {
          newRooms.push({
            id: `new_${Date.now()}_${i}`,
            nama: '',
            kapasitas: 0,
            lokasi: '-',
            // FIX: Use snake_case for properties
            supervisor_ids: [],
            proctor_id: '',
            student_ids: [],
            token: generateToken()
          });
        }
        return { ...prev, rooms: newRooms };
      } else {
        return { ...prev, rooms: currentRooms.slice(0, val) };
      }
    });
  };

  const updateRoomData = (index: number, data: Partial<SessionRoom>) => {
    setFormData(prev => {
      const updated = [...(prev.rooms || [])];
      updated[index] = { ...updated[index], ...data };
      return { ...prev, rooms: updated };
    });
  };

  const removeRoomAt = (index: number) => {
    if (roomCount <= 1) return;
    setFormData(prev => {
      const updated = (prev.rooms || []).filter((_, i) => i !== index);
      setRoomCount(updated.length);
      return { ...prev, rooms: updated };
    });
  };

  // Fungsi Pembantu: Mendapatkan siswa yang sudah di-enroll di ruang LAIN
  const getEnrolledInOtherRooms = (currentRoomIndex: number) => {
    const others = (formData.rooms || []).filter((_, i) => i !== currentRoomIndex);
    // FIX: Use snake_case for property
    return new Set(others.flatMap(r => r.student_ids));
  };

  const autoDistributeParticipants = () => {
    if (!formData.rooms || formData.rooms.length === 0 || availableStudentsPool.length === 0) return;
    setFormData(prev => {
      const updatedRooms = [...(prev.rooms || [])];
      let studentIdx = 0;
      // FIX: Use snake_case for property
      updatedRooms.forEach(r => r.student_ids = []);
      updatedRooms.forEach(room => {
        if (room.kapasitas > 0) {
          const available = Math.min(room.kapasitas, availableStudentsPool.length - studentIdx);
          if (available > 0) {
            // FIX: Use snake_case for property
            room.student_ids = availableStudentsPool.slice(studentIdx, studentIdx + available).map(s => s.id);
            studentIdx += available;
          }
        }
      });
      return { ...prev, rooms: updatedRooms };
    });
  };

  useEffect(() => {
    if (formData.start_time && selectedPkg) {
      const [h, m] = formData.start_time.split(':').map(Number);
      const totalMinutes = h * 60 + m + selectedPkg.duration;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      setFormData(prev => ({ 
        ...prev, 
        end_time: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}` 
      }));
    }
  }, [formData.start_time, selectedPkg]);

  const validateStep = () => {
    if (step === 1) return !!(formData.name && formData.schedule_id && formData.date && formData.start_time);
    if (step === 2) {
      if (!formData.rooms || formData.rooms.length === 0) return false;
      const totalCap = formData.rooms.reduce((acc, r) => acc + r.kapasitas, 0);
      // FIX: Use snake_case for property
      const totalEnrolled = formData.rooms.reduce((acc, r) => acc + r.student_ids.length, 0);
      
      if (totalEnrolled === 0) {
        alert("Peringatan: Belum ada peserta yang di-enroll ke ruang ujian manapun. Berita acara dan daftar hadir akan kosong.");
        return false;
      }
      
      for (const r of formData.rooms) {
        if (!r.nama) { alert("Satu atau lebih unit ruang belum ditentukan dari master data."); return false; }
        // FIX: Use snake_case for property
        if (!r.supervisor_ids[0]) { alert(`Ruang '${r.nama}' wajib memiliki pengawas utama.`); return false; }
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }
    const finalData: ExamSession = {
      ...formData as ExamSession,
      id: initialData?.id || `sess_${Date.now()}`
    };
    onSave(finalData);
  };

  // KOMPONEN INTERNAL: MODAL ENROLLMENT
  const StudentEnrollmentModal = ({ roomIndex }: { roomIndex: number }) => {
    const room = formData.rooms![roomIndex];
    const otherEnrolled = getEnrolledInOtherRooms(roomIndex);
    // FIX: Use snake_case for property
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(room.student_ids));
    const [search, setSearch] = useState('');
    const [filterRombel, setFilterRombel] = useState('');

    const rombels = useMemo(() => Array.from(new Set(availableStudentsPool.map(s => s.rombel))), []);

    const filteredPool = useMemo(() => {
      return availableStudentsPool.filter(s => {
        const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search);
        const matchRombel = filterRombel === '' || s.rombel === filterRombel;
        return matchSearch && matchRombel;
      });
    }, [search, filterRombel]);

    const handleToggle = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= room.kapasitas) {
          alert(`Kapasitas Ruang ${room.nama} Terbatas (${room.kapasitas} Orang).`);
          return;
        }
        next.add(id);
      }
      setSelectedIds(next);
    };

    const handleSelectAll = () => {
      const next = new Set(selectedIds);
      filteredPool.forEach(s => {
        if (!otherEnrolled.has(s.id) && next.size < room.kapasitas) {
          next.add(s.id);
        }
      });
      setSelectedIds(next);
    };

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-white rounded-sm shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col border border-gray-400 animate-in zoom-in duration-200">
          <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
            <div>
               <h3 className="text-sm font-black uppercase text-gray-800 tracking-tight">Kelola Peserta: {room.nama || `Unit ${roomIndex+1}`}</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Status: {selectedIds.size} / {room.kapasitas} Terplotting</p>
            </div>
            <button onClick={() => setEnrollmentModal(null)} className="text-gray-400"><X size={24}/></button>
          </div>

          <div className="p-4 border-b bg-white flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input value={search} onChange={e => setSearch(e.target.value)} className="gov-input w-full pl-10 text-[11px] font-bold" placeholder="CARI NAMA SISWA / NIS..." />
            </div>
            <select value={filterRombel} onChange={e => setFilterRombel(e.target.value)} className="gov-input text-[11px] font-bold uppercase">
               <option value="">SEMUA ROMBEL</option>
               {rombels.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={handleSelectAll} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm font-black text-[10px] uppercase hover:bg-emerald-100">
               Pilih Semua di List
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPool.map(s => {
                const isOther = otherEnrolled.has(s.id);
                const isSelected = selectedIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    disabled={isOther}
                    onClick={() => handleToggle(s.id)}
                    className={`p-3 border rounded-sm text-left transition-all relative ${
                      isOther ? 'opacity-30 bg-gray-100 border-gray-200 cursor-not-allowed' :
                      isSelected ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-gray-800 uppercase truncate pr-6">{s.nama}</span>
                       <span className="text-[9px] font-bold text-gray-400 font-mono">NIS: {s.nis} | RM: {s.rombel}</span>
                    </div>
                    {isSelected && <div className="absolute top-2 right-2 text-emerald-600"><Check size={16} strokeWidth={3} /></div>}
                    {isOther && <span className="text-[7px] font-black text-gray-400 absolute bottom-1 right-2 uppercase">Sudah di Ruang Lain</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-[10px] font-black text-gray-400 uppercase italic">
              {selectedIds.size} Peserta Terpilih
            </div>
            <div className="flex gap-2">
               <button onClick={() => setEnrollmentModal(null)} className="px-6 py-2 text-gray-500 font-black text-[10px] uppercase tracking-widest">Batal</button>
               <button 
                 onClick={() => {
                   // FIX: Use snake_case for property
                   updateRoomData(roomIndex, { student_ids: Array.from(selectedIds) });
                   setEnrollmentModal(null);
                 }}
                 className="px-10 py-2 bg-emerald-700 text-white rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg"
               >
                 Simpan Peserta
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-700 text-white rounded-sm shadow-sm"><Calendar size={24} /></div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Implementasi Teknis Sesi Ujian</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Tahap {step}/3: {step === 1 ? 'Waktu & Paket' : step === 2 ? 'Distribusi Ruang & Pengawas' : 'Instruksi & Finalisasi'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-12 h-1 border-t-4 transition-all duration-500 ${step >= s ? 'border-emerald-700' : 'border-gray-200'}`} />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8 pb-10">
        <div className="lg:col-span-3 space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="gov-card p-6 space-y-6">
                <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2">Identitas & Waktu Sesi</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Pilih Paket Ujian</label>
                    <select required value={formData.schedule_id} onChange={e => setFormData({...formData, schedule_id: e.target.value, rooms: []})} className={`gov-input w-full font-black uppercase text-xs ${packages.length === 0 ? 'border-red-300 bg-red-50' : ''}`}>
                      <option value="">-- PILIH PAKET SIAP DIGUNAKAN --</option>
                      {packages.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name} - {p.subject} (Kelas {p.level})</option>)}
                    </select>
                  </div>
                  {selectedPkg && (
                    <div className="col-span-2 p-5 bg-emerald-50 border border-emerald-200 rounded-sm grid grid-cols-4 gap-4 animate-in zoom-in duration-150">
                      <div><span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Mata Pelajaran</span><p className="text-[10px] font-black text-emerald-900 uppercase">{selectedPkg.subject}</p></div>
                      <div><span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Kelas Sasaran</span><p className="text-[10px] font-black text-emerald-900 uppercase">KELAS {selectedPkg.level}</p></div>
                      <div><span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Jumlah Peserta</span><p className="text-[10px] font-black text-blue-900 uppercase">{availableStudentsPool.length} SISWA</p></div>
                      <div><span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Durasi Paket</span><p className="text-[10px] font-black text-emerald-900 uppercase">{selectedPkg.duration} MENIT</p></div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nama Sesi Pelaksanaan</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="gov-input w-full font-bold" placeholder="MISAL: SESI UTAMA HARI PERTAMA" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tanggal Pelaksanaan</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="gov-input w-full font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Jam Mulai</label>
                      <input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="gov-input w-full font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Jam Selesai (Auto)</label>
                      <input type="time" readOnly value={formData.end_time} className="gov-input w-full font-bold bg-gray-50 text-emerald-700 border-emerald-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="gov-card p-6 bg-emerald-900 text-white flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/10 rounded-sm"><Users size={28} /></div>
                   <div>
                      <h4 className="text-sm font-black uppercase tracking-widest">Penjadwalan Unit Ruang</h4>
                      {/* FIX: Use snake_case for property */}
                      <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-tight">Total Peserta Level Ini: {availableStudentsPool.length} Siswa | Terplotting: {formData.rooms?.reduce((a, b) => a + b.student_ids.length, 0)} Siswa</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <button type="button" onClick={autoDistributeParticipants} disabled={!formData.rooms?.some(r => r.kapasitas > 0)} className="px-6 py-2 bg-white text-emerald-900 font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-xl disabled:opacity-50">
                     <RefreshCcw size={14} /> Auto-Distribute
                   </button>
                </div>
              </div>
              <div className="space-y-6">
                {(formData.rooms || []).map((room, idx) => (
                  <div key={room.id} className="gov-card border-l-4 border-l-emerald-700 overflow-hidden shadow-md animate-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-sm text-[10px] font-black uppercase">Unit {idx + 1}</span>
                         {room.nama && (
                           <div className="flex items-center gap-1.5 text-emerald-700">
                              <UserCheck size={12} />
                              {/* FIX: Use snake_case for property */}
                              <span className="text-[10px] font-black uppercase tracking-tight">{room.student_ids.length} / {room.kapasitas} TERPLOTTING</span>
                           </div>
                         )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button" 
                          disabled={!room.nama}
                          onClick={() => setEnrollmentModal({ roomIndex: idx })}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-sm font-black text-[9px] uppercase tracking-widest transition-all ${room.nama ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                           <Users size={12} /> Kelola Peserta Ruang
                        </button>
                        <button type="button" onClick={() => removeRoomAt(idx)} className="text-red-400 hover:text-red-700 transition-colors">
                           <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-4">
                          <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Lokasi & Kapasitas</h5>
                          <div className="space-y-3">
                             <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Pilih Master Ruang <span className="text-red-500">*</span></label>
                                <select required value={roomsMaster.find(rm => rm.nama === room.nama)?.id || ''} onChange={e => {
                                    const selected = roomsMaster.find(rm => rm.id === e.target.value);
                                    if (selected) {
                                      updateRoomData(idx, { nama: selected.nama, kapasitas: selected.kapasitas, lokasi: selected.lokasi || '-' });
                                    }
                                  }} className="gov-input w-full font-black text-xs cursor-pointer">
                                  <option value="">-- PILIH DARI MASTER --</option>
                                  {roomsMaster.map(rm => {
                                    const isUsed = formData.rooms?.some((r, i) => i !== idx && r.nama === rm.nama);
                                    return <option key={rm.id} value={rm.id} disabled={isUsed}>{rm.nama} {isUsed ? '(TERPAKAI)' : ''}</option>
                                  })}
                                </select>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div>
                                   <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Kapasitas Maks.</label>
                                   <input type="text" readOnly value={room.kapasitas ? `${room.kapasitas} SISWA` : '-'} className="gov-input w-full font-black text-xs bg-gray-100 text-gray-500 border-gray-200" />
                                </div>
                                <div>
                                   <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Lokasi</label>
                                   <input readOnly value={room.lokasi} className="gov-input w-full font-bold text-xs bg-gray-100 text-gray-500 border-gray-200" />
                                </div>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Pengawasan</h5>
                          <div className="space-y-3">
                             <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Pengawas Utama (Wajib)</label>
                                {/* FIX: Use snake_case for property */}
                                <select required value={room.supervisor_ids[0]} onChange={e => {
                                    const next = [...room.supervisor_ids];
                                    next[0] = e.target.value;
                                    // FIX: Use snake_case for property
                                    updateRoomData(idx, { supervisor_ids: next });
                                  }} className="gov-input w-full text-xs font-bold">
                                  <option value="">-- PILIH PENGAWAS --</option>
                                  {supervisorsPool.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Proktor Sesi</label>
                                {/* FIX: Use snake_case for property */}
                                <select value={room.proctor_id} onChange={e => updateRoomData(idx, { proctor_id: e.target.value })} className="gov-input w-full text-xs font-bold">
                                  <option value="">-- PILIH PROKTOR --</option>
                                  {proctorsPool.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                                </select>
                             </div>
                          </div>
                       </div>
                       <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm flex flex-col justify-between">
                          <div>
                             <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Token Login Ruang</span>
                             <div className="flex items-center justify-between">
                                <span className="text-xl font-mono font-black text-emerald-800 tracking-widest">{room.token}</span>
                                <button type="button" onClick={() => updateRoomData(idx, { token: generateToken() })} className="p-1 hover:bg-gray-200 rounded text-gray-400 transition-colors">
                                   <RefreshCcw size={14} />
                                </button>
                             </div>
                          </div>
                          <div className="mt-6 pt-4 border-t border-gray-200">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Status Pengisian</span>
                                {/* FIX: Use snake_case for property */}
                                <span className={`text-[10px] font-black ${room.student_ids.length > room.kapasitas ? 'text-red-600' : 'text-emerald-700'}`}>
                                   {/* FIX: Use snake_case for property */}
                                   {room.student_ids.length} / {room.kapasitas || 0}
                                </span>
                             </div>
                             <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                {/* FIX: Use snake_case for property */}
                                <div className={`h-full transition-all duration-500 ${room.student_ids.length > (room.kapasitas || 0) ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${room.kapasitas > 0 ? Math.min(100, (room.student_ids.length / room.kapasitas) * 100) : 0}%` }} />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => handleRoomCountChange(roomCount + 1)} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-sm text-gray-400 font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-3">
                  <Plus size={20} /> Tambah Unit Ruang Lainnya
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
               <div className="grid grid-cols-2 gap-6">
                 <div className="gov-card p-6 space-y-4 shadow-sm">
                   <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><ShieldCheck size={14} /> Instruksi Khusus Pengawas</h4>
                   <textarea value={formData.proctor_instructions} onChange={e => setFormData({...formData, proctor_instructions: e.target.value})} className="gov-input w-full h-40 text-xs leading-relaxed" placeholder="Petunjuk khusus pengawas..." />
                 </div>
                 <div className="gov-card p-6 space-y-4 shadow-sm">
                   <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Info size={14} /> Instruksi Peserta Didik</h4>
                   <textarea value={formData.student_instructions} onChange={e => setFormData({...formData, student_instructions: e.target.value})} className="gov-input w-full h-40 text-xs leading-relaxed" placeholder="Instruksi pengerjaan siswa..." />
                 </div>
               </div>
               <div className="gov-card p-10 text-center bg-[#fcfcfc] border-2 border-emerald-700 space-y-4 shadow-xl">
                  <CheckCircle2 size={56} className="mx-auto text-emerald-600" />
                  <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Sesi Ujian Siap Diaktifkan</h4>
                  <div className="pt-6 grid grid-cols-4 gap-4 border-t border-gray-100">
                     <div className="text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block">Total Unit Ruang</span>
                        <p className="text-sm font-black text-emerald-800">{formData.rooms?.length} UNIT</p>
                     </div>
                     <div className="text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block">Total Pengawas</span>
                        {/* FIX: Use snake_case for property */}
                        <p className="text-sm font-black text-emerald-800">{new Set(formData.rooms?.flatMap(r => r.supervisor_ids.filter(Boolean))).size} ORANG</p>
                     </div>
                     <div className="text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block">Peserta Terplotting</span>
                        {/* FIX: Use snake_case for property */}
                        <p className="text-sm font-black text-blue-800">{formData.rooms?.reduce((acc, r) => acc + r.student_ids.length, 0)} SISWA</p>
                     </div>
                     <div className="text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block">Status Publikasi</span>
                        <p className="text-sm font-black text-emerald-800 uppercase">{formData.status}</p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-1 space-y-6">
           <div className="gov-card overflow-hidden shadow-lg border-2 border-emerald-700 bg-white p-5 space-y-6">
              <div className="flex items-center gap-3 border-b pb-4"><Lock size={18} className="text-emerald-700" /><span className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Validasi Sesi</span></div>
              <div className="space-y-5">
                 <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Status Publikasi</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="gov-input w-full text-[10px] font-black uppercase">
                      <option value="Disiapkan">DISIAPKAN (ANTRIAN)</option>
                      <option value="Berlangsung">BERLANGSUNG (LIVE)</option>
                    </select>
                 </div>
                 <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-gray-400 uppercase">Paket Ref:</span><span className="text-gray-800 uppercase font-black truncate max-w-[120px]">{selectedPkg?.name || '-'}</span></div>
                    <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-gray-400 uppercase">Target Kelas:</span><span className="text-gray-800 font-black">{selectedPkg?.level || '-'}</span></div>
                 </div>
              </div>
           </div>
           <div className="bg-gray-800 p-5 rounded-sm shadow-xl space-y-3 sticky top-24">
              <button type="submit" disabled={packages.length === 0} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.15em] rounded-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50">
                {step === 3 ? <><Save size={18} /> Simpan & Aktifkan</> : <><ArrowRight size={18} /> Tahap Berikutnya</>}
              </button>
              {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-black text-[10px] uppercase tracking-widest rounded-sm flex items-center justify-center gap-2"><ChevronLeft size={16} /> Kembali</button>}
              <button type="button" onClick={onCancel} className="w-full py-2.5 bg-transparent border border-gray-600 text-gray-400 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-sm transition-colors">Batalkan</button>
           </div>
        </div>
      </form>

      {/* RENDER MODAL ENROLLMENT */}
      {enrollmentModal && <StudentEnrollmentModal roomIndex={enrollmentModal.roomIndex} />}
    </div>
  );
};

export default ExamSessionForm;

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Key, Eye, EyeOff, User, GraduationCap, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { Student, GradeLevel, RombelMaster, ExamRoom } from '../types.ts';

interface StudentFormProps {
  initialData?: Student | null;
  schoolId: string;
  existingNis: string[];
  gradeLevels: GradeLevel[];
  rombels: RombelMaster[];
  roomsMaster: ExamRoom[];
  jenjang: string;
  onSave: (data: Student) => void;
  onCancel: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ initialData, schoolId, existingNis, gradeLevels, rombels, roomsMaster, jenjang, onSave, onCancel }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({
    nis: '',
    nama: '',
    jenis_kelamin: 'Laki-laki',
    kelas: '',
    rombel: '',
    status: 'Aktif',
    username: '',
    password: ''
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, password: '' }); // Kosongkan password saat edit
    } else {
      setFormData(prev => ({
        ...prev,
        kelas: gradeLevels.length > 0 ? gradeLevels[0].nama : '',
        rombel: rombels.length > 0 ? rombels[0].nama : ''
      }));
    }
  }, [initialData, gradeLevels, rombels]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'nis') {
        next.username = value;
      }
      return next;
    });
  };

  const validate = () => {
    if (!formData.nis) return "Nomor Induk Siswa (NIS) wajib diisi.";
    if (existingNis.includes(formData.nis!) && (!initialData || initialData.nis !== formData.nis)) {
      return "NIS sudah terdaftar di sistem.";
    }
    if (!formData.nama) return "Nama lengkap wajib diisi.";
    if (!formData.kelas) return "Kelas wajib dipilih.";
    if (!formData.rombel) return "Rombel wajib dipilih.";
    if (!initialData && !formData.password) return "Password wajib diisi untuk siswa baru.";
    return null;
  };

  const generatePassword = () => {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let retVal = "";
    for (let i = 0, n = charset.length; i < 6; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    setFormData(prev => ({ ...prev, password: retVal }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const studentData: Partial<Student> = {
      id: initialData?.id,
      school_id: schoolId,
      nis: formData.nis!,
      nama: formData.nama!,
      jenis_kelamin: formData.jenis_kelamin as any,
      kelas: formData.kelas!,
      rombel: formData.rombel!,
      status: formData.status as any,
      username: formData.username || formData.nis!,
      updated_at: new Date().toISOString()
    };
    
    // Kirim plain text, DB trigger akan hash
    if (formData.password) {
      studentData.password = formData.password;
    }

    onSave(studentData as Student);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-300 animate-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 text-white rounded-sm">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">
                {initialData ? 'Perbarui Database Siswa' : 'Registrasi Database Siswa'}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Identitas Peserta Didik Utama</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-gray-200 rounded-sm text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <form id="student-form" onSubmit={handleSubmit} className="space-y-10">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-sm flex items-center gap-3">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[10px] font-black uppercase">{error}</p>
              </div>
            )}

            <div className="space-y-8">
              {/* Seksi Identitas Pokok */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <User size={14} className="text-emerald-700" />
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Identitas Pokok</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">NIS (Database Key)</label>
                    <input required name="nis" value={formData.nis || ''} onChange={handleChange} className="gov-input font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Nama Lengkap Siswa</label>
                    <input required name="nama" value={formData.nama || ''} onChange={handleChange} className="gov-input font-bold uppercase" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Jenis Kelamin</label>
                      <select name="jenis_kelamin" value={formData.jenis_kelamin || 'Laki-laki'} onChange={handleChange} className="gov-input font-bold text-xs">
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Status Siswa</label>
                      <select name="status" value={formData.status || 'Aktif'} onChange={handleChange} className="gov-input font-bold text-xs">
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                        <option value="Pindah">Pindah</option>
                        <option value="Lulus">Lulus</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Seksi Akademik */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <GraduationCap size={14} className="text-emerald-700" />
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Data Akademik</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Tingkat Kelas</label>
                      <select name="kelas" value={formData.kelas || ''} onChange={handleChange} className="gov-input font-bold text-xs">
                        <option value="">-- Pilih --</option>
                        {gradeLevels.map(g => <option key={g.id} value={g.nama}>Kelas {g.nama}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Rombel</label>
                      <select name="rombel" value={formData.rombel || ''} onChange={handleChange} className="gov-input font-bold text-xs">
                        <option value="">-- Pilih --</option>
                        {rombels.map(r => <option key={r.id} value={r.nama}>{r.nama}</option>)}
                      </select>
                    </div>
                </div>
              </section>

              {/* Seksi Akses Sistem */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <ShieldCheck size={14} className="text-emerald-700" />
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Akses Sistem</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Username (Read Only)</label>
                    <input name="username" value={formData.username || ''} onChange={handleChange} className="gov-input font-mono text-xs" readOnly />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Password</label>
                    <div className="relative flex items-center group">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        name="password" 
                        value={formData.password || ''} 
                        onChange={handleChange} 
                        className="gov-input font-mono font-bold pr-20"
                        placeholder={initialData ? "Isi untuk mengubah" : "Wajib diisi"}
                      />
                      <div className="absolute right-1 flex items-center gap-1 bg-white pl-2">
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-gray-400 hover:text-emerald-700">
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button type="button" onClick={generatePassword} className="p-1.5 text-gray-400 hover:text-emerald-700">
                          <Key size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-sm">
          <button type="button" onClick={onCancel} className="gov-btn gov-btn-secondary">Batalkan</button>
          <button type="submit" form="student-form" className="gov-btn gov-btn-primary bg-emerald-800 hover:bg-emerald-900">
            <Save size={14} /> Simpan Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
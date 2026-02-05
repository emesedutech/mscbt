import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Key, UserCheck } from 'lucide-react';
import { Teacher, SubjectMaster } from '../types.ts';
import { POSITIONS } from '../constants.tsx';

interface TeacherFormProps {
  initialData?: Teacher | null;
  schoolId: string;
  existingNips: string[];
  subjects: SubjectMaster[];
  onSave: (data: Teacher) => void;
  onCancel: () => void;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ initialData, schoolId, existingNips, subjects, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Teacher>>({
    nip: '',
    nama: '',
    gelar_depan: '',
    gelar_belakang: '',
    jenis_kelamin: 'Laki-laki',
    mata_pelajaran: [],
    status: 'PNS',
    jabatan: 'Guru Mapel',
    email: '',
    no_hp: '',
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, password: '' }); // Kosongkan password saat edit
    }
  }, [initialData]);

  const validateField = (name: string, value: string): string => {
    if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      return 'Format email tidak valid.';
    }
    if (name === 'no_hp' && value && !/^\d{10,14}$/.test(value)) {
      return 'No. HP harus 10-14 digit angka.';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'nip' && !prev.username) {
        next.username = value;
      }
      return next;
    });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubjectToggle = (subjectName: string) => {
    setFormData(prev => {
      const current = prev.mata_pelajaran || [];
      const updated = current.includes(subjectName)
        ? current.filter(s => s !== subjectName)
        : [...current, subjectName];
      return { ...prev, mata_pelajaran: updated };
    });
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nip) newErrors.nip = "NIP wajib diisi.";
    if (existingNips.includes(formData.nip!) && (!initialData || initialData.nip !== formData.nip)) {
      newErrors.nip = "NIP sudah terdaftar.";
    }
    if (!formData.nama) newErrors.nama = "Nama lengkap wajib diisi.";
    if (!initialData && !formData.password) newErrors.password = "Password wajib diisi untuk pengguna baru.";

    const emailError = validateField('email', formData.email || '');
    if (emailError) newErrors.email = emailError;
    const phoneError = validateField('no_hp', formData.no_hp || '');
    if (phoneError) newErrors.no_hp = phoneError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      return;
    }

    const teacherData: Partial<Teacher> = {
      id: initialData?.id,
      school_id: schoolId,
      nip: formData.nip!,
      nama: formData.nama!,
      gelar_depan: formData.gelar_depan || '',
      gelar_belakang: formData.gelar_belakang || '',
      jenis_kelamin: formData.jenis_kelamin as any,
      mata_pelajaran: formData.mata_pelajaran!,
      status: formData.status as any,
      jabatan: formData.jabatan as any,
      email: formData.email || '',
      no_hp: formData.no_hp || '',
      username: formData.username || formData.nip!,
    };

    if (formData.password) {
      teacherData.password = formData.password;
    }

    onSave(teacherData as Teacher);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-4xl animate-in zoom-in duration-200 my-8 border border-gray-300">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 text-white rounded-sm"><UserCheck size={20}/></div>
            <div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                {initialData ? 'Edit Data Pengelola' : 'Tambah Pengelola Baru'}
              </h2>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-4 border-b pb-1">Identitas & Akses</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">NIP</label>
                    <input required name="nip" value={formData.nip} onChange={handleChange} className={`gov-input font-mono font-bold ${errors.nip ? 'border-red-500' : ''}`} />
                    {errors.nip && <p className="text-red-500 text-xs mt-1">{errors.nip}</p>}
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Nama Lengkap</label>
                    <input required name="nama" value={formData.nama} onChange={handleChange} className={`gov-input font-bold ${errors.nama ? 'border-red-500' : ''}`} />
                    {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Jenis Kelamin</label>
                      <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className="gov-input text-xs font-bold uppercase">
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Password</label>
                      <input name="password" type="password" value={formData.password} onChange={handleChange} className={`gov-input font-mono font-bold ${errors.password ? 'border-red-500' : ''}`} placeholder={initialData ? "Isi untuk mengubah" : "Wajib diisi"} />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Email</label>
                    <input name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} className={`gov-input font-bold ${errors.email ? 'border-red-500' : ''}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">No. HP</label>
                    <input name="no_hp" value={formData.no_hp} onChange={handleChange} onBlur={handleBlur} className={`gov-input font-bold ${errors.no_hp ? 'border-red-500' : ''}`} />
                    {errors.no_hp && <p className="text-red-500 text-xs mt-1">{errors.no_hp}</p>}
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-4 border-b pb-1">Jabatan & Mapel</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Jabatan</label>
                    <select name="jabatan" value={formData.jabatan} onChange={handleChange} className="gov-input text-xs font-bold uppercase">
                      {POSITIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-200 max-h-40 overflow-y-auto">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Mata Pelajaran Diampu</p>
                    {subjects.map(s => (
                      <label key={s.id} className="flex items-center gap-3 p-1 cursor-pointer">
                        <input type="checkbox" checked={formData.mata_pelajaran?.includes(s.nama)} onChange={() => handleSubjectToggle(s.nama)} />
                        <span className="text-[10px] font-bold uppercase">{s.nama}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200">
            <button type="button" onClick={onCancel} className="gov-btn gov-btn-secondary">Batal</button>
            <button type="submit" className="gov-btn gov-btn-primary">
              <Save size={16} /> Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherForm;
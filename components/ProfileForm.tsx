import React, { useState, useEffect } from 'react';
import { Save, Upload, X, ArrowLeft, User, Hash, Loader2 } from 'lucide-react';
import { SchoolProfile } from '../types.ts';
import { supabase } from '../lib/supabase.ts';

interface ProfileFormProps {
  initialData?: SchoolProfile | null;
  onSave: (data: SchoolProfile) => void;
  onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<SchoolProfile>>({
    npsn: '',
    nama_sekolah: '',
    jenjang: 'SMP/MTs',
    status: 'Negeri',
    alamat: '',
    kota_kabupaten: '',
    provinsi: '',
    kode_pos: '',
    telepon: '',
    email: '',
    website: '',
    kop_surat: '',
    kepala_sekolah: '',
    nip_kepala_sekolah: ''
  });

  const [previewKop, setPreviewKop] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
      if (initialData.kop_surat) setPreviewKop(initialData.kop_surat);
    }
  }, [initialData]);

  const validateField = (name: string, value: string): string => {
    if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      return 'Format email tidak valid.';
    }
    if (name === 'telepon' && value && !/^\d{10,14}$/.test(value)) {
      return 'Nomor telepon harus 10-14 digit angka.';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const schoolId = formData.school_id;
      if (!schoolId) {
        throw new Error("ID Sekolah tidak ditemukan, tidak dapat mengunggah file.");
      }
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `kop_surat_${Date.now()}.${fileExt}`;
      const filePath = `public/${schoolId}/profile/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setPreviewKop(publicUrl);
      setFormData(prev => ({ ...prev, kop_surat: publicUrl }));
    } catch (error: any) {
      alert(`Gagal mengunggah kop surat: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as SchoolProfile);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {initialData?.id ? 'Perbarui Profil Sekolah' : 'Lengkapi Profil Sekolah'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Kop Surat Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-4 uppercase tracking-widest text-[10px]">Kop Surat (Disimpan di Cloud Storage)</label>
          <div className="flex items-center gap-6">
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white hover:border-emerald-400 transition-colors w-full h-40 flex items-center justify-center">
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={32} className="animate-spin text-gray-400"/>
                  <span className="text-xs font-bold text-gray-500">Mengunggah...</span>
                </div>
              ) : previewKop ? (
                <div className="relative group w-full h-full flex items-center justify-center">
                  <img src={previewKop} alt="Kop Surat Preview" className="max-h-full max-w-full object-contain" />
                  <button 
                    type="button"
                    onClick={() => { setPreviewKop(null); setFormData(p => ({ ...p, kop_surat: '' })); }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-8 cursor-pointer text-center">
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500 font-bold uppercase tracking-tighter">Pilih Gambar Kop Surat</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>
        </div>
        
        {/* Data Identitas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2">Identitas Sekolah</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">NPSN</label>
                <input readOnly name="npsn" value={formData.npsn} onChange={handleChange} className="gov-input font-mono font-bold" placeholder="12345678" />
                <p className="text-[9px] text-gray-400 mt-1 italic">NPSN ditetapkan oleh Superadmin.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nama Satuan Pendidikan</label>
                <input readOnly name="nama_sekolah" value={formData.nama_sekolah} onChange={handleChange} className="gov-input font-bold" placeholder="Nama Sekolah Lengkap" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Jenjang</label>
                  <select name="jenjang" value={formData.jenjang} onChange={handleChange} className="gov-input text-xs font-bold">
                    <option>SD/MI</option>
                    <option>SMP/MTs</option>
                    <option>SMA/SMK/MA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="gov-input text-xs font-bold">
                    <option>Negeri</option>
                    <option>Swasta</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2">Otoritas Pengesahan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nama Kepala Sekolah</label>
                <input required name="kepala_sekolah" value={formData.kepala_sekolah} onChange={handleChange} className="gov-input font-bold" placeholder="Nama Lengkap dengan Gelar" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">NIP Kepala Sekolah</label>
                <input required name="nip_kepala_sekolah" value={formData.nip_kepala_sekolah} onChange={handleChange} className="gov-input font-mono font-bold" placeholder="19XXXXXXXXXXXXX" />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm">
                 <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed tracking-tight italic">
                    Data pengesahan ini akan muncul secara otomatis pada footer seluruh dokumen laporan dan analisis hasil ujian.
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lokasi & Kontak */}
        <div className="space-y-6">
           <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2">Alamat & Kontak</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Alamat Lengkap</label>
                <textarea name="alamat" value={formData.alamat} onChange={handleChange} className="gov-input h-[106px] text-xs font-bold" placeholder="Jl. Pendidikan No. 1..." />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Kota / Kabupaten</label>
                  <input name="kota_kabupaten" value={formData.kota_kabupaten} onChange={handleChange} className="gov-input font-bold" placeholder="Contoh: Pontianak" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Provinsi</label>
                  <input name="provinsi" value={formData.provinsi} onChange={handleChange} className="gov-input font-bold" placeholder="Contoh: Kalimantan Barat" />
                </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Telepon</label>
                <input name="telepon" value={formData.telepon} onChange={handleChange} onBlur={handleBlur} className={`gov-input font-mono font-bold ${errors.telepon ? 'border-red-500' : ''}`} placeholder="0561-xxxx" />
                {errors.telepon && <p className="text-red-500 text-xs mt-1">{errors.telepon}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Email</label>
                <input name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} className={`gov-input font-bold ${errors.email ? 'border-red-500' : ''}`} placeholder="kontak@sekolah.sch.id" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Website</label>
                <input name="website" value={formData.website} onChange={handleChange} className="gov-input font-bold" placeholder="www.sekolah.sch.id" />
              </div>
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-8 border-t">
          <button 
            type="button"
            onClick={onCancel}
            className="gov-btn gov-btn-secondary"
          >
            Batal
          </button>
          <button 
            type="submit"
            className="gov-btn gov-btn-primary"
          >
            <Save size={16} /> Simpan Profil Sekolah
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
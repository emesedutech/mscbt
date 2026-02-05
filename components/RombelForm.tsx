import React, { useState, useEffect } from 'react';
import { X, Save, Users, Layers, AlertCircle } from 'lucide-react';
import { GradeLevel, RombelMaster } from '../types';

interface RombelFormProps {
  item?: RombelMaster | null;
  gradeLevels: GradeLevel[];
  existingRombels: RombelMaster[];
  onSave: (data: Partial<RombelMaster>) => void;
  onCancel: () => void;
}

const RombelForm: React.FC<RombelFormProps> = ({ item, gradeLevels, existingRombels, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    kelas_id: item?.kelas_id || '',
    nama: item?.nama || ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kelas_id || !formData.nama) {
      setError('Tingkat Kelas dan Nama Rombel wajib diisi.');
      return;
    }
    
    // Check for duplicates within the same class
    const isDuplicate = existingRombels.some(
      r => r.kelas_id === formData.kelas_id && r.nama.toUpperCase() === formData.nama.toUpperCase() && r.id !== item?.id
    );

    if(isDuplicate) {
      setError('Nama Rombel sudah ada untuk tingkat kelas yang dipilih.');
      return;
    }

    onSave({ ...item, ...formData });
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-md border border-gray-300">
        <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-gray-800">{item ? 'Edit' : 'Tambah'} Rombongan Belajar</h3>
            <button onClick={onCancel}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 rounded-sm"><AlertCircle size={16}/> {error}</div>}
            <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block flex items-center gap-2"><Layers size={14}/> Tingkat Kelas</label>
                <select 
                    required 
                    value={formData.kelas_id} 
                    onChange={e => setFormData({...formData, kelas_id: e.target.value})} 
                    className="gov-input w-full font-bold"
                    disabled={!!item} // Prevent changing class when editing
                >
                    <option value="">-- Pilih Tingkat Kelas --</option>
                    {gradeLevels.map(g => <option key={g.id} value={g.id}>Kelas {g.nama}</option>)}
                </select>
                {item && <p className="text-[9px] italic text-gray-400 mt-1">Tingkat kelas tidak dapat diubah saat mengedit.</p>}
            </div>
            <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block flex items-center gap-2"><Users size={14}/> Nama Rombel</label>
                <input required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value.toUpperCase()})} className="gov-input w-full font-bold uppercase" placeholder="Contoh: A, B, C atau Pagi, Siang"/>
            </div>
            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="gov-btn gov-btn-secondary">Batal</button>
                <button type="submit" className="gov-btn gov-btn-primary"><Save size={14}/> Simpan</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default RombelForm;

import React, { useState, useEffect } from 'react';
import { X, Save, Layers, BookOpen, Users, MapPin } from 'lucide-react';

interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'number';
}

interface MasterDataFormProps {
  title: string;
  item: any | null;
  fields: FieldConfig[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

const MasterDataForm: React.FC<MasterDataFormProps> = ({ title, item, fields, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      const initial: any = {};
      fields.forEach(f => initial[f.key] = f.type === 'number' ? 0 : '');
      setFormData(initial);
    }
  }, [item, fields]);

  const getIcon = () => {
    if (title.toLowerCase().includes('kelas')) return <Layers size={18} />;
    if (title.toLowerCase().includes('mapel')) return <BookOpen size={18} />;
    if (title.toLowerCase().includes('rombel')) return <Users size={18} />;
    return <MapPin size={18} />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    let hasError = false;

    fields.forEach(f => {
      if (!formData[f.key] && formData[f.key] !== 0) {
        newErrors[f.key] = true;
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const payload = { ...formData };
    // Hanya sertakan ID jika sedang mengedit item yang sudah ada.
    if (item?.id) {
      payload.id = item.id;
    } else {
      // Untuk item baru, hapus properti ID agar database yang membuatnya.
      delete payload.id;
    }
    
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden border border-gray-300 animate-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 text-white rounded-sm shadow-sm">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">{item ? 'Perbarui' : 'Tambah'} {title}</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Pengaturan Entitas Master Data</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest">
                {f.label} <span className="text-red-500">*</span>
              </label>
              <input
                type={f.type || 'text'}
                value={formData[f.key] || ''}
                onChange={(e) => {
                  setFormData({ ...formData, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value });
                  setErrors({ ...errors, [f.key]: false });
                }}
                className={`gov-input font-bold ${errors[f.key] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                placeholder={`INPUT ${f.label.toUpperCase()}...`}
                autoFocus={fields[0].key === f.key}
              />
            </div>
          ))}

          {/* Footer Actions */}
          <div className="pt-4 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="gov-btn gov-btn-secondary flex-1 text-[10px]"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="gov-btn gov-btn-primary flex-[2] text-[10px]"
            >
              <Save size={14} /> Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterDataForm;
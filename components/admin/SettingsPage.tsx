
import React from 'react';
import { Save } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="gov-card p-8 max-w-2xl space-y-6">
      <h3 className="text-lg font-black uppercase text-gray-800 border-b pb-4">Pengaturan Sistem</h3>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase">Mode Ujian</label>
          <select className="gov-input">
            <option>Hybrid (Online/Offline)</option>
            <option>Full Online</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase">Durasi Default (Menit)</label>
          <input type="number" defaultValue={90} className="gov-input" />
        </div>
        <button className="gov-btn gov-btn-primary w-full">
          <Save size={16}/> Simpan Konfigurasi
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

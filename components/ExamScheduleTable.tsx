import React, { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  Layers, 
  Search, 
  BookOpen,
  Clock,
  ChevronRight
} from 'lucide-react';
import { ExamSchedule } from '../types.ts';

interface ExamScheduleTableProps {
  data: ExamSchedule[];
  onEdit: (s: ExamSchedule) => void;
  onDelete: (s: ExamSchedule) => void;
  onManageContent: (s: ExamSchedule) => void;
}

const ExamScheduleTable: React.FC<ExamScheduleTableProps> = ({ data, onEdit, onDelete, onManageContent }) => {
  const [search, setSearch] = useState('');

  const filteredData = data.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="gov-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="CARI PAKET UJIAN BERDASARKAN NAMA ATAU KODE..."
            className="gov-input w-full pl-10 uppercase tracking-widest text-[10px] font-black"
          />
        </div>
      </div>

      <div className="gov-table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th className="w-12 text-center">No</th>
              <th>Identitas Paket (Akademik)</th>
              <th>Mata Pelajaran</th>
              <th className="text-center">Tingkat</th>
              <th className="text-center">Jml Soal</th>
              <th className="text-center">Durasi</th>
              <th className="text-center">Status</th>
              <th className="text-right w-32">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? filteredData.map((s, idx) => {
              return (
                <tr key={s.id}>
                  <td className="text-center text-xs font-bold text-gray-500">{idx + 1}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 uppercase text-xs tracking-tight">{s.name}</span>
                      <span className="text-[9px] text-gray-400 font-mono mt-0.5">CODE: {s.code}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-[10px] font-black text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">{s.subject}</span>
                  </td>
                  <td className="text-center">
                    <span className="text-[10px] font-black text-gray-700 uppercase">KELAS {s.level}</span>
                  </td>
                  <td className="text-center">
                    <span className="text-[11px] font-black text-gray-700">{s.question_count} BUTIR</span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-gray-600">
                      <Clock size={12} />
                      <span className="text-[10px] font-black uppercase">{s.duration} MIN</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                      s.status === 'Siap Digunakan' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => onManageContent(s)} className="p-1.5 border border-gray-200 rounded-sm hover:bg-gray-50 text-gray-400 hover:text-emerald-700" title="Kelola Konten Soal"><BookOpen size={14} /></button>
                      <button onClick={() => onEdit(s)} className="p-1.5 border border-gray-200 rounded-sm hover:bg-gray-50 text-gray-400 hover:text-emerald-700" title="Edit Jadwal"><Edit2 size={14} /></button>
                      <button onClick={() => onDelete(s)} className="p-1.5 border border-gray-200 rounded-sm hover:bg-red-50 text-gray-400 hover:text-red-700" title="Hapus"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="text-center py-20 bg-gray-50/30">
                  <div className="flex flex-col items-center">
                    <BookOpen size={32} className="text-gray-200 mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Belum Ada Paket Ujian Dibuat</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamScheduleTable;


import React from 'react';
import { Layers, Edit2, Trash2, ChevronRight, BookOpen, Clock } from 'lucide-react';
import { ExamSchedule } from '../types.ts';

interface PackageTableProps {
  data: ExamSchedule[];
  onEdit: (pkg: ExamSchedule) => void;
  onDelete: (pkg: ExamSchedule) => void;
  onPreview: (pkg: ExamSchedule) => void;
}

const PackageTable: React.FC<PackageTableProps> = ({ data, onEdit, onDelete, onPreview }) => {
  return (
    <div className="gov-table-container">
      <table className="gov-table">
        <thead>
          <tr>
            <th>Identitas Paket</th>
            <th>Mata Pelajaran</th>
            <th className="text-center">Soal</th>
            <th className="text-center">Durasi</th>
            <th className="text-center">Status</th>
            <th className="text-right">Operasional</th>
          </tr>
        </thead>
        <tbody>
          {data.map((pkg) => (
            <tr key={pkg.id} className="group hover:bg-gray-50 transition-colors">
              <td className="py-4">
                <div className="flex flex-col">
                  <span className="font-black text-gray-900 text-xs uppercase">{pkg.name}</span>
                  <span className="text-[9px] text-gray-400 font-mono">CODE: {pkg.code}</span>
                </div>
              </td>
              <td>
                <span className="text-[10px] font-black text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">
                  {pkg.subject} • KELAS {pkg.level}
                </span>
              </td>
              <td className="text-center">
                <span className="text-sm font-black text-gray-700">{pkg.question_count}</span>
              </td>
              <td className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-500 font-bold text-[10px]">
                  <Clock size={12}/> {pkg.duration}M
                </div>
              </td>
              <td className="text-center">
                <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${
                  pkg.status === 'Siap Digunakan' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-400'
                }`}>
                  {pkg.status}
                </span>
              </td>
              <td className="text-right">
                <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all">
                  <button onClick={() => onPreview(pkg)} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-sm" title="Pratinjau"><BookOpen size={14}/></button>
                  <button onClick={() => onEdit(pkg)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-sm" title="Edit"><Edit2 size={14}/></button>
                  <button onClick={() => onDelete(pkg)} className="p-2 hover:bg-red-50 text-red-600 rounded-sm" title="Hapus"><Trash2 size={14}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PackageTable;

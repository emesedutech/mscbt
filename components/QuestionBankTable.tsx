import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  Layers, 
  CheckCircle, 
  XCircle,
  Filter,
  BookOpen
} from 'lucide-react';
import { QuestionBank, SubjectMaster } from '../types.ts';

interface QuestionBankTableProps {
  data: QuestionBank[];
  subjects: SubjectMaster[];
  onAdd: () => void;
  onEdit: (bank: QuestionBank) => void;
  onDelete: (bank: QuestionBank) => void;
  onViewDetails: (bank: QuestionBank) => void;
}

const QuestionBankTable: React.FC<QuestionBankTableProps> = ({ 
  data, 
  subjects,
  onAdd, 
  onEdit, 
  onDelete, 
  onViewDetails 
}) => {
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const filteredData = useMemo(() => {
    return data.filter(bank => {
      const matchSearch = bank.subject.toLowerCase().includes(search.toLowerCase());
      const matchSubject = filterSubject === '' || bank.subject === filterSubject;
      return matchSearch && matchSubject;
    });
  }, [data, search, filterSubject]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Manajemen Bank Soal Lokal</h2>
          <p className="text-sm text-gray-500 font-medium">Buat wadah untuk mengelompokkan butir soal berdasarkan mapel dan kelas.</p>
        </div>
        <button 
          onClick={onAdd}
          className="gov-btn gov-btn-primary text-xs"
        >
          <Plus size={16} /> Buat Wadah Soal Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Wadah Bank', value: data.length, icon: <Layers size={18} /> },
          { label: 'Total Butir Soal', value: data.reduce((acc, curr) => acc + (curr.question_count || 0), 0), icon: <FileText size={18} /> },
          { label: 'Bank Soal Aktif', value: data.filter(b => b.is_active).length, icon: <CheckCircle size={18} /> }
        ].map((stat, i) => (
          <div key={i} className="gov-card p-4 flex items-center gap-4">
            <div className="p-3 bg-gray-50 border border-gray-200 text-gray-600 rounded-sm">
              {stat.icon}
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-xl font-black text-gray-800 tracking-tight">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar Search */}
      <div className="gov-card p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Identitas Mata Pelajaran..."
            className="gov-input w-full pl-10"
          />
        </div>
        <select 
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="gov-input min-w-[180px] font-bold text-xs uppercase"
        >
          <option value="">Semua Kurikulum</option>
          {subjects.map(s => <option key={s.id} value={s.nama}>{s.nama}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="gov-table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Identitas Bank</th>
              <th>Mata Pelajaran</th>
              <th className="text-center">Tingkat</th>
              <th className="text-center">Jml Soal</th>
              <th className="text-center">Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? filteredData.map((bank) => (
              <tr key={bank.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 border border-gray-200 text-emerald-800 rounded-sm"><BookOpen size={14} /></div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 text-xs uppercase tracking-tight">Bank {bank.subject}</span>
                      <span className="text-[9px] text-gray-400 font-mono">ID: {bank.id.toUpperCase()}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="text-[10px] font-black text-gray-600 uppercase border border-gray-200 px-2 py-0.5 rounded-sm bg-gray-50 tracking-tighter">
                    {bank.subject}
                  </span>
                </td>
                <td className="text-center">
                  <span className="text-xs font-black text-gray-700">{bank.level}</span>
                </td>
                <td className="text-center">
                  <span className="text-sm font-black text-emerald-800">{bank.question_count}</span>
                </td>
                <td className="text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                    bank.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {bank.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <button 
                      onClick={() => onViewDetails(bank)} 
                      className="gov-btn gov-btn-secondary px-3 py-1 text-[10px]"
                    >
                      Buka <ChevronRight size={12} />
                    </button>
                    <button onClick={() => onEdit(bank)} className="p-1.5 border border-gray-200 rounded-sm hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Edit2 size={14} /></button>
                    <button onClick={() => onDelete(bank)} className="p-1.5 border border-gray-200 rounded-sm hover:bg-red-50 text-gray-400 hover:text-red-700"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center py-20 bg-gray-50/50">
                  <div className="flex flex-col items-center">
                    <Layers size={32} className="text-gray-200 mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Data Bank Soal Belum Tersedia</p>
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

export default QuestionBankTable;

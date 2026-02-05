
import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  BarChart3, 
  Printer, 
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Eye,
  X,
  Check,
  Slash
} from 'lucide-react';
import { ExamResult, Student, SchoolProfile } from '../types.ts';
import * as XLSX from 'xlsx';

interface ResultListProps {
  results: ExamResult[];
  students: Student[];
  school: SchoolProfile | null;
  examName: string;
  onPrintLeger: (payload: any) => void;
}

const ResultList: React.FC<ResultListProps> = ({ results, students, school, examName, onPrintLeger }) => {
  const [search, setSearch] = useState('');
  const [auditItem, setAuditItem] = useState<ExamResult | null>(null);

  const fmt = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  const rankedResults = useMemo(() => {
    return [...results]
      .sort((a, b) => b.final_grade - a.final_grade)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));
  }, [results]);

  const stats = useMemo(() => {
    if (results.length === 0) return { avg: 0, high: 0, low: 0, passCount: 0 };
    const grades = results.map(r => r.final_grade);
    const total = grades.reduce((a, b) => a + b, 0);
    return {
      avg: fmt(total / grades.length),
      high: Math.max(...grades),
      low: Math.min(...grades),
      passCount: results.filter(r => r.is_passed).length
    };
  }, [results]);

  const filteredResults = rankedResults.filter(r => 
    r.student_name.toLowerCase().includes(search.toLowerCase()) || r.nis.includes(search)
  );

  const handleExportExcel = () => {
    const exportData = rankedResults.map(r => ({
      'Rank': r.rank,
      'NIS': r.nis,
      'Nama Peserta': r.student_name,
      'Benar': r.correct,
      'Salah': r.incorrect,
      'Skor': fmt(r.final_grade),
      'Status': r.is_passed ? 'LULUS' : 'REMEDIAL'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leger Nilai");
    XLSX.writeFile(wb, `Leger_${examName.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Rata-Rata Kelas', val: stats.avg, icon: <TrendingUp size={18}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Skor Tertinggi', val: stats.high, icon: <Trophy size={18}/>, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Ketuntasan', val: `${Math.round((stats.passCount / results.length) * 100 || 0)}%`, icon: <CheckCircle2 size={18}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Peserta', val: results.length, icon: <BarChart3 size={18}/>, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map((s, i) => (
          <div key={i} className={`gov-card p-6 flex items-center justify-between border-b-2 ${s.bg}`}>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <h4 className={`text-2xl font-black ${s.color}`}>{s.val}</h4>
            </div>
            <div className={`p-2 rounded-sm ${s.color} opacity-80`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="gov-card overflow-hidden shadow-lg border-gray-300">
        <div className="p-4 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} className="gov-input w-full pl-10 text-[10px] font-black uppercase" placeholder="Cari NIS atau Nama..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => onPrintLeger({ school, examName, data: rankedResults })} className="gov-btn bg-gray-900 text-white hover:bg-black text-[10px]">
              <Printer size={14}/> Cetak Leger
            </button>
            <button onClick={handleExportExcel} className="gov-btn gov-btn-primary text-[10px]">
              <FileSpreadsheet size={14}/> Export Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th className="w-16 text-center">Rank</th>
                <th>Peserta Didik (NIS)</th>
                <th className="text-center">B / S</th>
                <th className="text-center">Skor Akhir</th>
                <th className="text-center">Status</th>
                <th className="text-right">Audit</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r) => (
                <tr key={r.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-[10px] ${
                      r.rank === 1 ? 'bg-orange-100 text-orange-700' :
                      r.rank === 2 ? 'bg-blue-100 text-blue-700' :
                      r.rank === 3 ? 'bg-gray-100 text-gray-700' : 'text-gray-400'
                    }`}>
                      {r.rank}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-black text-gray-800 text-xs uppercase">{r.student_name}</span>
                      <span className="text-[9px] text-gray-400 font-mono">NIS: {r.nis}</span>
                    </div>
                  </td>
                  <td className="text-center font-mono text-[10px] font-bold">
                    <span className="text-emerald-600">{r.correct}</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-red-400">{r.incorrect}</span>
                  </td>
                  <td className="text-center">
                    <span className="text-lg font-black text-gray-900">{fmt(r.final_grade)}</span>
                  </td>
                  <td className="text-center">
                    <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${
                      r.is_passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {r.is_passed ? 'LULUS' : 'REMEDIAL'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button onClick={() => setAuditItem(r)} className="p-2 text-gray-400 hover:text-emerald-700 transition-colors">
                      <Eye size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Audit Lembar Jawaban */}
      {auditItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col animate-in zoom-in duration-200 border border-gray-400">
              <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                 <div>
                    <h3 className="text-sm font-black uppercase text-gray-800 tracking-tight">Audit Lembar Jawaban</h3>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase mt-1">{auditItem.student_name} ({auditItem.nis})</p>
                 </div>
                 <button onClick={() => setAuditItem(null)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-4">
                 <div className="grid grid-cols-10 gap-2">
                    {auditItem.answers.map((ans, idx) => {
                      // Catatan: Di sistem objective, kita tahu ini benar/salah dari status scoring
                      // Tapi untuk audit visual, kita tampilkan kotak progres
                      return (
                        <div key={idx} className="flex flex-col items-center">
                           <div className={`w-10 h-10 border-2 rounded-sm flex items-center justify-center font-black text-xs ${
                             ans.answer ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-300'
                           }`}>
                              {idx + 1}
                           </div>
                           <span className="text-[9px] font-black mt-1 uppercase text-emerald-700">{ans.answer || '-'}</span>
                        </div>
                      );
                    })}
                 </div>
                 <div className="pt-8 border-t space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detail Pelanggaran Sesi</h4>
                    <div className="p-4 bg-gray-50 rounded-sm border border-gray-200">
                       <p className="text-xs font-bold text-gray-700 uppercase">Pelanggaran Terdeteksi: <span className={auditItem.violations_count > 0 ? 'text-red-600' : 'text-emerald-700'}>{auditItem.violations_count} Kali</span></p>
                       <p className="text-[9px] text-gray-400 mt-1 uppercase italic">Log audit ini mencatat perpindahan tab atau upaya keluar dari layar penuh.</p>
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end">
                 <button onClick={() => setAuditItem(null)} className="px-10 py-2 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-sm">Tutup Audit</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ResultList;

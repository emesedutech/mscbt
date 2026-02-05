import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileDown, 
  Edit2, 
  Trash2, 
  ArrowLeft,
  HelpCircle,
  Hash,
  CheckCircle2,
  Zap,
  ListFilter,
  Type as TypeIcon,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Question, QuestionBank } from '../types.ts';
import QuestionPreviewModal from './QuestionPreviewModal.tsx';
import QuestionImportModal from './QuestionImportModal.tsx';
import { stripHtml } from '../lib/utils.ts';

interface QuestionListTableProps {
  bank: QuestionBank;
  questions: Question[];
  onBack: () => void;
  onAddQuestion: () => void;
  onImportQuestions: (newQuestions: Question[]) => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (q: Question) => void;
}

const QuestionListTable: React.FC<QuestionListTableProps> = ({ 
  bank, 
  questions, 
  onBack, 
  onAddQuestion, 
  onImportQuestions,
  onEditQuestion,
  onDeleteQuestion
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const itemsPerPage = 10;

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => 
      (q.question_text || '').toLowerCase().includes(search.toLowerCase()) ||
      q.type.toLowerCase().includes(search.toLowerCase()) ||
      (q.category || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [questions, search]);

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedData = filteredQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pilihan_ganda': return <Hash size={14} className="text-blue-500" />;
      case 'pilihan_ganda_kompleks': return <CheckCircle2 size={14} className="text-purple-500" />;
      case 'benar_salah': return <Zap size={14} className="text-orange-500" />;
      case 'menjodohkan': return <ListFilter size={14} className="text-emerald-500" />;
      case 'isian_singkat': return <TypeIcon size={14} className="text-gray-500" />;
      default: return <HelpCircle size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Header Halaman Detail */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bank Soal: {bank.subject}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                {bank.level}
              </span>
              <span className="text-xs text-gray-400 font-medium">•</span>
              <span className="text-xs text-gray-400 font-medium">ID: {bank.id.toUpperCase()}</span>
            </div>
          </div>
        </div>
        
        {/* Action Bar Soal */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-5 py-2.5 border-2 border-emerald-600 text-emerald-700 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-50 transition-all text-sm"
          >
            <FileDown size={18} /> Import Soal
          </button>
          <button 
            onClick={onAddQuestion}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 text-sm"
          >
            <Plus size={18} /> Tambah Soal
          </button>
        </div>
      </div>

      {/* Toolbar Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan teks soal atau topik..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Tabel Daftar Soal */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16 text-center">No</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Tipe Soal</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Butir Pertanyaan (Ringkasan)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-24">Kesulitan</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-20">Bobot</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-44">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length > 0 ? paginatedData.map((q, idx) => (
                <tr key={q.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 text-center text-sm font-bold text-gray-400">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded">
                        {getTypeIcon(q.type)}
                      </div>
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">
                        {q.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-800 line-clamp-2 leading-relaxed font-medium editor-content">
                      {stripHtml(q.question_text)}
                    </div>
                    <div className="flex gap-2 mt-1.5">
                       <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">KD/Topik: {q.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      q.difficulty === 'Sulit' ? 'bg-red-50 text-red-600' :
                      q.difficulty === 'Sedang' ? 'bg-blue-50 text-blue-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-gray-900">{q.weight}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setPreviewQuestion(q)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                        title="Preview Tampilan Siswa"
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button 
                        onClick={() => onEditQuestion(q)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Edit Soal"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteQuestion(q)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Hapus Soal"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4">
                        <HelpCircle size={32} />
                      </div>
                      <p className="text-gray-800 font-bold">Belum ada soal dalam bank ini.</p>
                      <p className="text-gray-400 text-sm mt-1">Gunakan tombol Tambah Soal atau Import Soal untuk mengisi bank soal.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-30 hover:bg-white transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-30 hover:bg-white transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Preview */}
      {previewQuestion && (
        <QuestionPreviewModal 
          question={previewQuestion} 
          onClose={() => setPreviewQuestion(null)} 
        />
      )}

      {/* Modal Import */}
      {isImportModalOpen && (
        <QuestionImportModal
          bankContext={bank}
          onImport={(newQuestions) => {
            onImportQuestions(newQuestions);
            setIsImportModalOpen(false);
          }}
          onCancel={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default QuestionListTable;

import React, { useState, useMemo } from 'react';
import { Search, Edit2, Trash2, ChevronLeft, ChevronRight, Key, Plus, FileSpreadsheet, UserPlus, Power, PowerOff, CheckCircle2 } from 'lucide-react';
import { Teacher, SubjectMaster } from '../types.ts';
import { EMPLOYMENT_STATUSES, POSITIONS } from '../constants.tsx';

interface TeacherTableProps {
  data: Teacher[];
  subjects: SubjectMaster[];
  onAdd: () => void;
  onImport: () => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onToggleStatus: (teacher: Teacher) => void;
  onConfirmAction: (config: { title: string; message: string; onConfirm: () => void; type?: 'danger'|'warning' }) => void;
}

const TeacherTable: React.FC<TeacherTableProps> = ({ data, subjects, onAdd, onImport, onEdit, onDelete, onToggleStatus, onConfirmAction }) => {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [successInfo, setSuccessInfo] = useState<{title: string, message: string} | null>(null);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    return data.filter(teacher => {
      const matchSearch = (teacher.nama + teacher.nip).toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === '' || teacher.jabatan === filterRole;
      return matchSearch && matchRole;
    });
  }, [data, search, filterRole]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleResetPassword = (t: Teacher) => {
    onConfirmAction({
      title: 'Reset Password Pengelola',
      message: `Anda akan mereset password untuk ${t.nama}. Password akan dikembalikan ke default "123456". Lanjutkan?`,
      type: 'warning',
      onConfirm: () => {
        setSuccessInfo({
          title: 'Reset Berhasil',
          message: `Password untuk akun ${t.username || t.nip} telah dikembalikan ke default.`
        });
      }
    });
  };

  const getFullName = (t: Teacher) => {
    return `${t.gelar_depan ? t.gelar_depan + ' ' : ''}${t.nama}${t.gelar_belakang ? ', ' + t.gelar_belakang : ''}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* SUCCESS MESSAGE MODAL */}
      {successInfo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-sm overflow-hidden border border-gray-300 animate-in zoom-in duration-200">
            <div className="h-1.5 w-full bg-emerald-600"></div>
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight mb-2">{successInfo.title}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight leading-relaxed">{successInfo.message}</p>
              <button 
                onClick={() => setSuccessInfo(null)}
                className="mt-6 w-full py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black transition-all"
              >
                Tutup Pesan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Manajemen Pengelola Sesi</h2>
          <p className="text-sm text-gray-500 font-medium">Kelola data Admin, Proktor, Pengawas, dan Guru Mata Pelajaran.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={onImport}
            className="gov-btn border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-[10px]"
          >
            <FileSpreadsheet size={16} /> Import Pengelola
          </button>
          <button 
            onClick={onAdd}
            className="gov-btn gov-btn-primary text-[10px]"
          >
            <UserPlus size={16} /> Tambah Pengelola
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="gov-card p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="CARI NAMA ATAU USERNAME..."
            className="gov-input w-full pl-10 uppercase tracking-widest text-[10px] font-black"
          />
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="gov-input text-[10px] font-black uppercase tracking-widest"
          >
            <option value="">SEMUA ROLE / JABATAN</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>

          {search && (
            <button 
              onClick={() => setSearch('')}
              className="gov-btn bg-white border-red-100 text-red-600 hover:bg-red-50 text-[10px]"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="gov-table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th className="w-12 text-center">No</th>
              <th>Nama Lengkap & NIP</th>
              <th>Username</th>
              <th>Role / Jabatan</th>
              <th className="text-center">Status</th>
              <th className="text-right w-48">Aksi Operasional</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((teacher, index) => (
              <tr key={teacher.id} className="hover:bg-gray-50 transition-colors group">
                <td className="text-center text-xs font-bold text-gray-400">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-900 uppercase text-xs">
                      {getFullName(teacher)}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono mt-0.5 tracking-tighter">NIP: {teacher.nip || '-'}</span>
                  </div>
                </td>
                <td>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100 uppercase">
                    {teacher.username || teacher.nip}
                  </span>
                </td>
                <td>
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{teacher.jabatan}</span>
                </td>
                <td className="text-center">
                  <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${
                    teacher.status === 'PNS' || teacher.status === 'PPPK' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    AKTIF
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleResetPassword(teacher)} 
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-sm border border-transparent hover:border-orange-100" 
                      title="Reset Password"
                    >
                      <Key size={14} />
                    </button>
                    <button 
                      onClick={() => onEdit(teacher)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-sm border border-transparent hover:border-emerald-100"
                      title="Edit Data"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onDelete(teacher)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-sm border border-transparent hover:border-red-100"
                      title="Hapus Data"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center py-20 text-gray-400 font-bold uppercase text-xs tracking-widest italic bg-gray-50/30">
                  Data pengelola belum tersedia. Klik "Tambah Pengelola" untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Menampilkan Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 border border-gray-300 rounded-sm bg-white disabled:opacity-30 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 border border-gray-300 rounded-sm bg-white disabled:opacity-30 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTable;

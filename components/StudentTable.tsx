
import React, { useState, useMemo } from 'react';
import { Search, Plus, FileSpreadsheet, Edit2, Trash2, ChevronLeft, ChevronRight, Users, UserSquare2, Key, CheckCircle2, MapPin, Clock } from 'lucide-react';
import { Student, GradeLevel, RombelMaster, ExamRoom } from '../types.ts';

interface StudentTableProps {
  data: Student[];
  gradeLevels: GradeLevel[];
  rombels: RombelMaster[];
  roomsMaster: ExamRoom[];
  jenjang: string;
  onAdd: () => void;
  onImport: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onConfirmAction: (config: { title: string; message: string; onConfirm: () => void; type?: 'danger'|'warning' }) => void;
}

const StudentTable: React.FC<StudentTableProps> = ({ data, gradeLevels, rombels, roomsMaster, jenjang, onAdd, onImport, onEdit, onDelete, onConfirmAction }) => {
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [successInfo, setSuccessInfo] = useState<{title: string, message: string} | null>(null);
  const itemsPerPage = 15;

  const filteredData = useMemo(() => {
    return data.filter(s => {
      const matchSearch = (s.nama + s.nis).toLowerCase().includes(search.toLowerCase());
      const matchKelas = filterKelas === '' || s.kelas === filterKelas;
      const matchStatus = filterStatus === '' || s.status === filterStatus;
      return matchSearch && matchKelas && matchStatus;
    });
  }, [data, search, filterKelas, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleResetLogin = (s: Student) => {
    onConfirmAction({
      title: 'Reset Login Peserta',
      message: `Konfirmasi reset status login untuk ${s.nama}? Peserta akan dapat melakukan login ulang di perangkat lain jika sebelumnya terdeteksi masih aktif.`,
      type: 'warning',
      onConfirm: () => {
        setSuccessInfo({
          title: 'Reset Login Berhasil',
          message: `Sesi login untuk ${s.nama} (${s.nis}) telah dibersihkan.`
        });
      }
    });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="gov-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Peserta Terdaftar</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{data.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
        </div>
        <div className="gov-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Siswa Aktif</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">{data.filter(s => s.status === 'Aktif').length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><UserSquare2 size={24} /></div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Data Peserta Didik</h2>
            <p className="text-sm text-gray-500 font-medium">Manajemen data login dan identitas akademik utama.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onImport} className="gov-btn border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs"><FileSpreadsheet size={16} /> Import Siswa</button>
            <button onClick={onAdd} className="gov-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg text-xs"><Plus size={16} /> Tambah Siswa</button>
          </div>
        </div>

        <div className="gov-card p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari NIS atau Nama..." className="gov-input w-full pl-10 pr-4" />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="gov-input text-xs font-bold text-gray-600">
                <option value="">Semua Kelas</option>
                {gradeLevels.map(c => <option key={c.id} value={c.nama}>Kelas {c.nama}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="gov-input text-xs font-bold text-gray-600">
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
          </div>
        </div>

        <div className="gov-table-container">
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th className="w-16 text-center">No</th>
                  <th>Identitas Peserta</th>
                  <th className="text-center">Kelas/Rmb</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? paginatedData.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="text-sm text-gray-500 font-bold text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 uppercase text-sm">{student.nama}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5 font-mono">NIS: {student.nis}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="text-xs font-black text-gray-600 uppercase">{student.kelas}-{student.rombel}</span>
                    </td>
                    <td className="text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        student.status === 'Aktif' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>{student.status}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleResetLogin(student)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-md" title="Reset Login"><Key size={16} /></button>
                        <button onClick={() => onEdit(student)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md" title="Edit Siswa"><Edit2 size={16} /></button>
                        <button onClick={() => onDelete(student)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Hapus Siswa"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400"><p className="font-bold text-lg">Data siswa tidak ditemukan</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Halaman {currentPage} dari {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTable;


import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Save, 
  X,
  UserPlus
} from 'lucide-react';
import { Teacher } from '../types.ts';

interface ProctorSupervisorManagementProps {
  teachers: Teacher[];
  onUpdateRole: (teacherId: string, newRole: Teacher['jabatan']) => void;
  onConfirmAction: (config: { title: string; message: string; onConfirm: () => void; type?: 'danger'|'warning' }) => void;
}

const ProctorSupervisorManagement: React.FC<ProctorSupervisorManagementProps> = ({ teachers, onUpdateRole, onConfirmAction }) => {
  const [activeTab, setActiveTab] = useState<'proktor' | 'pengawas'>('proktor');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { proctors, supervisors, availableTeachers } = useMemo(() => {
    const proctorsList: Teacher[] = [];
    const supervisorsList: Teacher[] = [];
    const availableTeachersList: Teacher[] = [];
    
    teachers.forEach(t => {
      if (t.jabatan === 'Proktor Sesi') proctorsList.push(t);
      else if (t.jabatan === 'Pengawas Ruang') supervisorsList.push(t);
      else if (t.jabatan === 'Guru Mapel' || !t.jabatan) availableTeachersList.push(t);
    });

    return { proctors: proctorsList, supervisors: supervisorsList, availableTeachers: availableTeachersList };
  }, [teachers]);

  const handleRevoke = (teacher: Teacher) => {
    onConfirmAction({
      title: `Cabut Hak Akses ${teacher.jabatan}`,
      message: `Anda yakin ingin mencabut hak akses ${teacher.jabatan} dari ${teacher.nama}? Peran akan dikembalikan ke 'Guru Mapel'.`,
      type: 'warning',
      onConfirm: () => onUpdateRole(teacher.id, 'Guru Mapel')
    });
  };

  const dataToShow = activeTab === 'proktor' ? proctors : supervisors;
  const tabTitle = activeTab === 'proktor' ? 'Proktor' : 'Pengawas';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Manajemen Proktor & Pengawas</h2>
          <p className="text-sm text-gray-500 font-medium">Kelola hak akses khusus untuk pengelola sesi ujian.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="gov-btn gov-btn-primary text-xs">
          <UserPlus size={16} /> Angkat Proktor / Pengawas Baru
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setActiveTab('proktor')} className={`py-2 px-6 text-sm font-bold flex items-center gap-2 ${activeTab === 'proktor' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}>
          <ShieldCheck size={16}/> Data Proktor ({proctors.length})
        </button>
        <button onClick={() => setActiveTab('pengawas')} className={`py-2 px-6 text-sm font-bold flex items-center gap-2 ${activeTab === 'pengawas' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}>
          <UserCheck size={16}/> Data Pengawas ({supervisors.length})
        </button>
      </div>

      <div className="gov-table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th className="w-16 text-center">No</th>
              <th>Nama Lengkap & NIP</th>
              <th>Username</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dataToShow.length > 0 ? dataToShow.map((user, idx) => (
              <tr key={user.id} className="group">
                <td className="text-center font-bold text-gray-500">{idx + 1}</td>
                <td>
                  <div className="flex flex-col">
                    <span className="font-black text-gray-800 text-sm uppercase">{user.nama}</span>
                    <span className="text-xs text-gray-400 font-mono">NIP: {user.nip}</span>
                  </div>
                </td>
                <td><span className="font-mono text-xs font-bold text-emerald-700">{user.username}</span></td>
                <td className="text-right">
                  <button onClick={() => handleRevoke(user)} className="gov-btn bg-red-50 text-red-700 border border-red-100 text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14}/> Cabut Hak
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="text-center py-16 italic text-gray-400">Belum ada {tabTitle} yang diangkat.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <AppointmentModal 
          availableTeachers={availableTeachers}
          onSave={(teacherId, role) => {
            onUpdateRole(teacherId, role);
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

const AppointmentModal: React.FC<{
  availableTeachers: Teacher[];
  onSave: (teacherId: string, newRole: Teacher['jabatan']) => void;
  onCancel: () => void;
}> = ({ availableTeachers, onSave, onCancel }) => {
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Proktor Sesi' | 'Pengawas Ruang'>('Proktor Sesi');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeacher && selectedRole) {
      onSave(selectedTeacher, selectedRole);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg border border-gray-300">
        <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-gray-800">Angkat Pengelola Ujian</h3>
          <button onClick={onCancel}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Guru</label>
            <select required value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="gov-input">
              <option value="">-- Pilih dari Guru yang Tersedia --</option>
              {availableTeachers.map(t => <option key={t.id} value={t.id}>{t.nama} ({t.nip})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Angkat Sebagai</label>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as any)} className="gov-input">
              <option value="Proktor Sesi">Proktor Sesi</option>
              <option value="Pengawas Ruang">Pengawas Ruang</option>
            </select>
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

export default ProctorSupervisorManagement;

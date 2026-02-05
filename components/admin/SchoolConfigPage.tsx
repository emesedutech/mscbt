import React, { useState, useMemo } from 'react';
import ProfileForm from '../ProfileForm.tsx';
import ProfilePreview from '../ProfilePreview.tsx';
import MasterDataForm from '../MasterDataForm.tsx';
import RombelForm from '../RombelForm.tsx';
import { SchoolProfile, GradeLevel, RombelMaster, SubjectMaster, ExamRoom } from '../../types.ts';
import { Layers, Users, BookOpen, MapPin, Trash2, Plus } from 'lucide-react';

interface SchoolConfigPageProps {
  mergedProfileData: SchoolProfile | null;
  masterKelas: GradeLevel[];
  masterRombel: RombelMaster[];
  masterMapel: SubjectMaster[];
  masterRuang: ExamRoom[];
  saveToDb: (stateKey: string, data: any) => Promise<void>;
  deleteFromDb: (stateKey: string, item: any) => void;
  subPath: string;
}

const SchoolConfigPage: React.FC<SchoolConfigPageProps> = ({
  mergedProfileData,
  masterKelas, masterRombel, masterMapel, masterRuang,
  saveToDb, deleteFromDb, subPath
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [masterModal, setMasterModal] = useState<any>(null);
  const [activeMasterTab, setActiveMasterTab] = useState('kelas');
  const [rombelModal, setRombelModal] = useState<{ isOpen: boolean; item: RombelMaster | null }>({ isOpen: false, item: null });

  const rombelsByClass = useMemo(() => {
    const grouped: { [key: string]: { classData: GradeLevel, rombels: RombelMaster[] } } = {};
    masterKelas.forEach(k => {
      grouped[k.id] = { classData: k, rombels: [] };
    });
    masterRombel.forEach(r => {
      if (grouped[r.kelas_id]) {
        grouped[r.kelas_id].rombels.push(r);
      }
    });
    return Object.values(grouped).sort((a,b) => a.classData.nama.localeCompare(b.classData.nama));
  }, [masterKelas, masterRombel]);

  function renderMaster(t: string, d: any[], k: string, i: any, f: any[]) {
    return (
      <div className="gov-card p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 font-black text-gray-800 text-sm uppercase">{i} {t}</div>
          <button onClick={() => setMasterModal({ isOpen: true, title: t, fields: f, stateKey: k, item: null })} className="gov-btn gov-btn-primary text-[10px]">
            <Layers size={16} /> Tambah
          </button>
        </div>
        <div className="gov-table-container">
          <table className="gov-table">
            <thead><tr className="text-left">{f.map((cl: any) => <th key={cl.key}>{cl.label}</th>)}<th></th></tr></thead>
            <tbody>{d.map((it: any) => <tr key={it.id}>{f.map((cl: any) => <td key={cl.key} className="text-xs font-bold uppercase">{it[cl.key]}</td>)}<td className="text-right"><button onClick={() => deleteFromDb(k, it)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    );
  }

  const RombelManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h3 className="font-black text-gray-800 text-sm uppercase flex items-center gap-3"><Users size={16}/> Manajemen Rombongan Belajar</h3>
          <button onClick={() => setRombelModal({ isOpen: true, item: null })} className="gov-btn gov-btn-primary text-[10px]">
            <Plus size={16} /> Tambah Rombel
          </button>
      </div>
      {rombelsByClass.length > 0 ? rombelsByClass.map(group => (
        <div key={group.classData.id} className="gov-card p-6">
          <h4 className="text-xs font-black text-emerald-700 uppercase mb-4">KELAS {group.classData.nama}</h4>
          {group.rombels.length > 0 ? (
            <div className="gov-table-container">
              <table className="gov-table">
                <thead><tr><th className="w-4/5">Nama Rombel</th><th className="text-right">Aksi</th></tr></thead>
                <tbody>
                  {group.rombels.map(rombel => (
                    <tr key={rombel.id}>
                      <td className="text-xs font-bold uppercase">{rombel.nama}</td>
                      <td className="text-right">
                        <button onClick={() => deleteFromDb('master_rombel', rombel)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-center text-gray-400 italic py-4">Belum ada rombel untuk kelas ini.</p>
          )}
        </div>
      )) : (
        <div className="gov-card p-10 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase">Data Tingkat Kelas belum ada.</p>
            <p className="text-xs text-gray-400 mt-1">Silakan tambahkan Tingkat Kelas terlebih dahulu sebelum membuat Rombel.</p>
        </div>
      )}
    </div>
  );

  if (subPath === '/profil-sekolah/master-data') {
    return (
      <>
        <div className="space-y-8">
          <div className="flex gap-1 border-b border-gray-200">
            {['kelas', 'rombel', 'mapel', 'ruang'].map(t => (
              <button key={t} onClick={() => setActiveMasterTab(t)} className={`py-2 px-6 text-[10px] font-black uppercase tracking-widest ${activeMasterTab === t ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-400'}`}>{t}</button>
            ))}
          </div>

          {activeMasterTab === 'rombel' ? (
            <RombelManagement />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeMasterTab === 'kelas' && renderMaster('Tingkat Kelas', masterKelas, 'master_kelas', <Layers size={16}/>, [{key: 'nama', label: 'Nama Tingkat'}])}
              {activeMasterTab === 'mapel' && renderMaster('Mata Pelajaran', masterMapel, 'master_mapel', <BookOpen size={16}/>, [{key: 'kode', label: 'Kode'}, {key: 'nama', label: 'Nama Mapel'}])}
              {activeMasterTab === 'ruang' && renderMaster('Ruang Ujian', masterRuang, 'master_ruang', <MapPin size={16}/>, [{key: 'kode', label: 'Kode'}, {key: 'nama', label: 'Nama Ruang'}, {key: 'kapasitas', label: 'Kapasitas', type: 'number'}])}
            </div>
          )}
        </div>
        
        {masterModal && <MasterDataForm title={masterModal.title} item={masterModal.item} fields={masterModal.fields} onSave={async (d) => { await saveToDb(masterModal.stateKey, d); setMasterModal(null); }} onCancel={() => setMasterModal(null)} />}
        {rombelModal.isOpen && <RombelForm item={rombelModal.item} gradeLevels={masterKelas} existingRombels={masterRombel} onSave={async (d) => { await saveToDb('master_rombel', d); setRombelModal({isOpen: false, item: null}); }} onCancel={() => setRombelModal({isOpen: false, item: null})} />}
      </>
    );
  }

  // Default to '/profil-sekolah'
  if (isEditing) {
    return <ProfileForm initialData={mergedProfileData} onSave={(d) => { saveToDb('school_profile', d); setIsEditing(false); }} onCancel={() => setIsEditing(false)} />;
  }
  return <ProfilePreview data={mergedProfileData} onEdit={() => setIsEditing(true)} onDelete={() => {}} onGoToForm={() => setIsEditing(true)} />;
};

export default SchoolConfigPage;

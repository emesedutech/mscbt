import React, { useState } from 'react';
import TeacherTable from '../TeacherTable.tsx';
import TeacherForm from '../TeacherForm.tsx';
import TeacherImportModal from '../TeacherImportModal.tsx';
import StudentTable from '../StudentTable.tsx';
import StudentForm from '../StudentForm.tsx';
import StudentImportModal from '../StudentImportModal.tsx';
import ProctorSupervisorManagement from '../ProctorSupervisorManagement.tsx';
import { School, Teacher, Student, GradeLevel, RombelMaster, SubjectMaster, ExamRoom } from '../../types.ts';

interface UserManagementPageProps {
  school: School | null;
  teachers: Teacher[];
  students: Student[];
  masterKelas: GradeLevel[];
  masterRombel: RombelMaster[];
  masterMapel: SubjectMaster[];
  masterRuang: ExamRoom[];
  saveToDb: (stateKey: string, data: any, forceInsert?: boolean) => Promise<void>;
  deleteFromDb: (stateKey: string, item: any) => void;
  updateTeacherRole: (teacherId: string, newRole: Teacher['jabatan']) => void;
  setConfirmModal: (config: any) => void;
  subPath: string;
}

const UserManagementPage: React.FC<UserManagementPageProps> = (props) => {
  const { school, teachers, students, masterMapel, masterKelas, masterRombel, masterRuang, saveToDb, deleteFromDb, updateTeacherRole, setConfirmModal, subPath } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const handleSave = async (key: string, data: any, forceInsert = false) => {
    await saveToDb(key, data, forceInsert);
    setIsEditing(false);
    setIsImporting(false);
    setSelectedItem(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsImporting(false);
    setSelectedItem(null);
  };

  switch (subPath) {
    case '/data-pengguna/peserta':
      if (isEditing) return <StudentForm initialData={selectedItem} schoolId={school!.id} existingNis={students.map(s => s.nis)} gradeLevels={masterKelas} rombels={masterRombel} roomsMaster={masterRuang} jenjang={school?.jenjang || ''} onSave={(d) => handleSave('students', d)} onCancel={handleCancel} />;
      if (isImporting) return <StudentImportModal jenjang={school?.jenjang || ''} existingNis={students.map(s => s.nis)} gradeLevels={masterKelas} rombels={masterRombel} onImport={(d) => handleSave('students', d, true)} onCancel={handleCancel} quotaLimit={school?.quota_limit || 0} currentStudentCount={students.length} />;
      return <StudentTable data={students} gradeLevels={masterKelas} rombels={masterRombel} roomsMaster={masterRuang} jenjang={school?.jenjang || ''} onAdd={() => { setIsEditing(true); setSelectedItem(null); }} onImport={() => setIsImporting(true)} onEdit={(item) => { setIsEditing(true); setSelectedItem(item); }} onDelete={(item) => deleteFromDb('students', item)} onConfirmAction={setConfirmModal} />;

    case '/data-pengguna/akses':
      return <ProctorSupervisorManagement teachers={teachers} onUpdateRole={updateTeacherRole} onConfirmAction={setConfirmModal} />;

    default: // '/data-pengguna'
      if (isEditing) return <TeacherForm initialData={selectedItem} schoolId={school!.id} existingNips={teachers.map(t => t.nip)} subjects={masterMapel} onSave={(d) => handleSave('teachers', d)} onCancel={handleCancel} />;
      if (isImporting) return <TeacherImportModal existingNips={teachers.map(t=>t.nip)} subjects={masterMapel} onImport={(d) => handleSave('teachers', d.teachers, true)} onCancel={handleCancel} />;
      return <TeacherTable data={teachers} subjects={masterMapel} onAdd={() => { setIsEditing(true); setSelectedItem(null); }} onImport={() => setIsImporting(true)} onEdit={(item) => { setIsEditing(true); setSelectedItem(item); }} onDelete={(item) => deleteFromDb('teachers', item)} onConfirmAction={setConfirmModal} onToggleStatus={() => {}} />;
  }
};

export default UserManagementPage;

import React, { useState, useEffect, useMemo } from 'react';
import { ADMIN_MENU_ITEMS, ROLE_PERMISSIONS } from '../constants.tsx';
import { supabase } from '../lib/supabase.ts';
import { useToast } from '../hooks/useToast.ts';

// Layout Components
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import Breadcrumb from './Breadcrumb.tsx';
import ConfirmModal from './ConfirmModal.tsx';
import PrintService from './PrintService.tsx';
import { Loader2 } from 'lucide-react';

// Page Components (Refactored)
import DashboardPage from './admin/DashboardPage.tsx';
import SchoolConfigPage from './admin/SchoolConfigPage.tsx';
import UserManagementPage from './admin/UserManagementPage.tsx';
import QuestionSourcePage from './admin/QuestionSourcePage.tsx';
import ExamPackagePage from './admin/ExamPackagePage.tsx';
import ExamSessionPage from './admin/ExamSessionPage.tsx';
import ExamExecutionPage from './admin/ExamExecutionPage.tsx';
import ReportPage from './admin/ReportPage.tsx';
import SettingsPage from './admin/SettingsPage.tsx';

import { 
  School, SchoolProfile, Teacher, Student, Question, QuestionBank, 
  ExamSchedule, ExamSession, GradeLevel, RombelMaster, 
  SubjectMaster, ExamRoom, ExamResult
} from '../types.ts';

const TABLE_MAP: { [key: string]: string } = {
  'school_profile': 'school_profiles', 'teachers': 'teachers', 'students': 'students',
  'question_banks': 'question_banks', 'questions': 'questions',
  'exam_schedules': 'exam_schedules', 'exam_sessions': 'exam_sessions',
  'master_kelas': 'master_kelas', 'master_rombel': 'master_rombel',
  'master_mapel': 'master_mapel', 'master_ruang': 'master_ruang',
  'exam_results': 'exam_results'
};

interface AdminPortalProps {
  user: any;
  role: 'admin' | 'guru' | 'proktor' | 'pengawas';
  onLogout: (path?: string, confirm?: boolean) => void;
  onNavigate: (path: string) => void; // Ditambahkan untuk sinkronisasi URL
}

const getAdminInitialPath = () => window.location.pathname;

const AdminPortal: React.FC<AdminPortalProps> = ({ user, role, onLogout, onNavigate }) => {
  const [activePath, setActivePath] = useState(getAdminInitialPath());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const toast = useToast();

  // Master State Declarations
  const [school, setSchool] = useState<School | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [masterKelas, setMasterKelas] = useState<GradeLevel[]>([]);
  const [masterRombel, setMasterRombel] = useState<RombelMaster[]>([]);
  const [masterMapel, setMasterMapel] = useState<SubjectMaster[]>([]);
  const [masterRuang, setMasterRuang] = useState<ExamRoom[]>([]);

  // UI State
  const [activePrintJob, setActivePrintJob] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);

  const filteredMenuItems = useMemo(() => {
    const allowedIds = ROLE_PERMISSIONS[role] || [];
    return ADMIN_MENU_ITEMS.filter(item => allowedIds.includes(item.id));
  }, [role]);

  const refreshData = async () => {
    if (!user.school_id) { setIsLoading(false); return; }
    setIsSyncing(true);
    const sId = user.school_id;
    try {
      const fetchTable = (table: string) => supabase.from(table).select('*').eq('school_id', sId);
      const results = await Promise.all([
        supabase.from('schools').select('*').eq('id', sId).single(),
        supabase.from('school_profiles').select('*').eq('school_id', sId).maybeSingle(),
        ...Object.values(TABLE_MAP).filter(t => t !== 'school_profiles').map(fetchTable)
      ]);
      const [schoolRes, profileRes, ...tableRes] = results;

      if (schoolRes.error) throw schoolRes.error;
      setSchool(schoolRes.data || null);
      if (profileRes.error) throw profileRes.error;
      setSchoolProfile(profileRes.data || null);

      const tableData: { [key: string]: any[] } = {};
      Object.values(TABLE_MAP).filter(t => t !== 'school_profiles').forEach((tableName, index) => {
        if (tableRes[index].error) throw tableRes[index].error;
        tableData[tableName] = tableRes[index].data || [];
      });
      
      setTeachers(tableData.teachers || []); setStudents(tableData.students || []);
      setQuestionBanks(tableData.question_banks || []); setQuestions(tableData.questions || []);
      setExamSchedules(tableData.exam_schedules || []); setExamSessions(tableData.exam_sessions || []);
      setExamResults(tableData.exam_results || []); setMasterKelas(tableData.master_kelas || []);
      setMasterRombel(tableData.master_rombel || []); setMasterMapel(tableData.master_mapel || []);
      setMasterRuang(tableData.master_ruang || []);
    } catch (e: any) {
      toast.error(`Gagal Muat Data: ${e.message}`);
    } finally {
      setIsSyncing(false); setIsLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, [user.school_id]);

  const augmentedQuestionBanks = useMemo(() => {
    return questionBanks.map(bank => ({
      ...bank,
      question_count: questions.filter(q => q.bank_id === bank.id).length
    }));
  }, [questionBanks, questions]);

  const saveToDb = async (stateKey: string, data: any, forceInsert: boolean = false) => {
    setIsSyncing(true);
    const tableName = TABLE_MAP[stateKey];
    try {
      const payload = (Array.isArray(data) ? data : [data]).map(p => ({
        ...p,
        school_id: user.school_id,
      }));
      
      let query;
      if (stateKey === 'school_profile') {
        query = schoolProfile?.id 
          ? supabase.from(tableName).update(payload[0]).eq('id', schoolProfile.id)
          : supabase.from(tableName).insert(payload[0]);
      } else {
        query = forceInsert 
          ? supabase.from(tableName).insert(payload)
          : supabase.from(tableName).upsert(payload, { onConflict: 'id' });
      }
      
      const { error } = await query;
      if (error) throw error;
      
      toast.success('Sinkronisasi data berhasil!');
      await refreshData();
    } catch (err: any) {
      toast.error(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const deleteFromDb = (stateKey: string, item: any) => {
    setConfirmModal({
      title: 'Hapus Data', message: 'Anda yakin ingin menghapus data ini secara permanen?', type: 'danger',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          await supabase.from(TABLE_MAP[stateKey]).delete().eq('id', item.id);
          toast.success('Data berhasil dihapus.');
          await refreshData();
        } catch (err: any) {
          toast.error(`Gagal hapus: ${err.message}`);
        } finally {
          setConfirmModal(null); setIsSyncing(false);
        }
      },
    });
  };

  const handleNavigate = (path: string) => {
    setActivePath(path);
    setIsSidebarOpen(false);
    onNavigate(path); // Update URL via App.tsx
  };
  
  const handleUpdateTeacherRole = (teacherId: string, newRole: Teacher['jabatan']) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) saveToDb('teachers', { ...teacher, jabatan: newRole });
  };

  const mergedProfileData = useMemo(() => {
    if (!school) return schoolProfile;
    return { ...schoolProfile, nama_sekolah: school.nama, npsn: school.npsn, kota_kabupaten: school.kota, jenjang: school.jenjang } as SchoolProfile;
  }, [school, schoolProfile]);

  const renderContent = () => {
    if (isLoading) return <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-gray-300" /></div>;
    
    const pageProps = {
      school, schoolProfile, mergedProfileData, teachers, students, questions, questionBanks, augmentedQuestionBanks, examSchedules, examSessions, examResults, masterKelas, masterRombel, masterMapel, masterRuang,
      saveToDb, deleteFromDb, refreshData, setConfirmModal, handleUpdateTeacherRole,
      user
    };

    if (activePath.startsWith('/profil-sekolah')) return <SchoolConfigPage {...pageProps} subPath={activePath} />;
    if (activePath.startsWith('/data-pengguna')) return <UserManagementPage {...pageProps} subPath={activePath} updateTeacherRole={handleUpdateTeacherRole} />;
    if (activePath.startsWith('/bank-soal')) return <QuestionSourcePage {...pageProps} subPath={activePath} schoolId={user.school_id} />;

    switch (activePath) {
      case '/': return <DashboardPage {...pageProps} schoolName={school?.nama} />;
      case '/paket-ujian': return <ExamPackagePage {...pageProps} />;
      case '/jadwal-ujian': return <ExamSessionPage {...pageProps} sessions={examSessions} packages={examSchedules} roomsMaster={masterRuang} />;
      case '/pelaksanaan': return <ExamExecutionPage {...pageProps} />;
      case '/laporan': return <ReportPage {...pageProps} />;
      case '/pengaturan': return <SettingsPage />;
      default: return <div className="py-20 text-center text-gray-400">Halaman sedang dikembangkan.</div>;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={() => onLogout()} onNavigate={handleNavigate} user={user} schoolName={school?.nama} />
      <div className="flex flex-1 pt-20 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} isCollapsed={isSidebarCollapsed} activePath={activePath} menuItems={filteredMenuItems} onNavigate={handleNavigate} onLogout={() => onLogout()} onCloseMobile={() => setIsSidebarOpen(false)} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} overflow-hidden`}>
          <div className="hidden md:block shrink-0">
            <Breadcrumb items={useMemo(() => {
              for (const item of filteredMenuItems) {
                if (item.path === activePath) return item.path !== '/' ? [{ label: item.label }] : [];
                if (item.children) {
                  const child = item.children.find(c => c.path === activePath);
                  if (child) return [{ label: item.label }, { label: child.label }];
                }
              }
              return [];
            }, [activePath, filteredMenuItems])} onNavigateHome={() => handleNavigate('/')} />
          </div>
          <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto scrollbar-hide">{renderContent()}</div>
          <footer className="shrink-0 py-4 px-10 text-center bg-white border-t border-gray-200">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Emes CBT &copy; {new Date().getFullYear()} Emes EduTech - Infrastructure v8.0
            </p>
          </footer>
        </main>
      </div>
      {confirmModal && <ConfirmModal title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} type={confirmModal.type} />}
      {activePrintJob && <PrintService {...activePrintJob} onDone={() => setActivePrintJob(null)} />}
    </div>
  );
};

export default AdminPortal;
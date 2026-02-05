import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.ts';
import { 
  Building2, Plus, Edit2, Loader2, Save, X, Search, 
  ShieldCheck, Copy, CheckCircle, Users, Handshake,
  Power, PowerOff, Key, Database, Trash2, AlertTriangle, Check, ArrowRight,
  Server, HardDrive, RefreshCw, Globe
} from 'lucide-react';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import Breadcrumb from './Breadcrumb.tsx';
import BillingManagement from './BillingManagement.tsx';
import ConfirmModal from './ConfirmModal.tsx';
import GlobalBankManagement from './GlobalBankManagement.tsx';
import { School, Reseller, SubscriptionPlan } from '../types.ts';
import { SUPERADMIN_MENU_ITEMS } from '../constants.tsx';
import { useToast } from '../hooks/useToast.ts';

interface SuperAdminPortalProps {
  user: any;
  onLogout: (path?: string, confirm?: boolean) => void;
  onDataChange: () => void;
  onNavigate: (path: string) => void;
}

const getSuperAdminInitialPath = () => {
    const path = window.location.pathname;
    if (path.startsWith('/sa')) {
        const subpath = path.substring(3); // Hapus '/sa'
        return subpath || '/'; // Jika hanya '/sa', kembalikan '/'
    }
    return '/';
};

const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ user, onLogout, onDataChange, onNavigate }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePath, setActivePath] = useState(getSuperAdminInitialPath());
  const toast = useToast();

  const [editingSchool, setEditingSchool] = useState<Partial<School> | null>(null);
  const [editingReseller, setEditingReseller] = useState<Partial<Reseller> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newAdminCreds, setNewAdminCreds] = useState<{username: string, pass: string, npsn: string} | null>(null);
  const [newResellerCreds, setNewResellerCreds] = useState<{username: string, pass: string} | null>(null);
  const [search, setSearch] = useState('');
  
  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; type: 'danger' | 'warning' } | null>(null);
  
  const [dbStats, setDbStats] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: schoolsData, error: schoolsError } = await supabase.from('schools').select('*, students(count)').order('nama', { ascending: true });
      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);

      const { data: resellersData, error: resellersError } = await supabase.from('resellers').select('*').order('nama', { ascending: true });
      if (resellersError) throw resellersError;
      setResellers(resellersData || []);
    } catch (error: any) {
      toast.error(`Gagal memuat data tenant: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMonitoringData = async () => {
    setIsLoading(true);
    setDbStats(null);
    try {
      const tables = [
        'schools', 'resellers', 'school_profiles', 
        'teachers', 'students', 
        'question_banks', 'questions', 
        'exam_schedules', 'exam_sessions', 'exam_results',
        'master_kelas', 'master_rombel', 'master_mapel', 'master_ruang',
        'global_question_banks', 'global_questions'
      ];
      const promises = tables.map(table => 
        supabase.from(table).select('*', { count: 'exact', head: true })
      );
      const results = await Promise.all(promises);
      
      const stats: { [key: string]: number | null } = {};
      tables.forEach((table, index) => {
        stats[table] = results[index].count;
      });

      setDbStats(stats as any);
      toast.info("Data sumber daya berhasil dimuat.");
    } catch (error: any) {
      toast.error(`Gagal muat data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activePath === '/monitoring-sumberdaya') {
      fetchMonitoringData();
    } else if (activePath === '/billing') {
      // Logic handled within component
    } else if (activePath === '/bank-soal-global') {
      // Logic handled within component
    } else {
      fetchData();
    }
  }, [activePath]);
  
  const handleNavigate = (path: string) => { 
    setActivePath(path); 
    setIsSidebarOpen(false); 
    if (onNavigate) {
        const newPath = path === '/' ? '/sa' : `/sa${path}`;
        onNavigate(newPath);
    }
  };

  const handleSaveSchool = async (formData: Partial<School>) => {
      setIsSaving(true);
      try {
        const isNew = !formData.id;
        const schoolPayload = {
          nama: formData.nama, npsn: formData.npsn, kota: formData.kota, jenjang: formData.jenjang,
          subdomain: formData.npsn, subscription_plan: formData.subscription_plan, quota_limit: formData.quota_limit,
          status: isNew ? 'ACTIVE' : formData.status,
          referral_id: isNew ? 'Pusat' : formData.referral_id,
        };

        if (isNew) {
          const { data: newSchool, error } = await supabase.from('schools').insert(schoolPayload).select().single();
          if (error || !newSchool) throw error;
          
          await supabase.from('school_profiles').insert({ school_id: newSchool.id, nama_sekolah: newSchool.nama, npsn: newSchool.npsn, jenjang: formData.jenjang, kota_kabupaten: newSchool.kota, status: 'Negeri' });
          
          const adminUsername = `admin.${newSchool.npsn}`;
          const adminPassword = Math.random().toString(36).slice(-8).toUpperCase();
          const { error: adminError } = await supabase.from('teachers').insert({ school_id: newSchool.id, nama: 'Admin Sekolah', nip: '', jabatan: 'Admin Sistem', username: adminUsername, password: adminPassword, status: 'GTY', jenis_kelamin: 'Laki-laki', mata_pelajaran: [] });
          
          if (adminError) throw adminError;
          
          setNewAdminCreds({ username: adminUsername, pass: adminPassword, npsn: newSchool.npsn });

        } else {
          const { error } = await supabase.from('schools').update(schoolPayload).eq('id', formData.id!);
          if (error) throw error;
          await supabase.from('school_profiles').update({ nama_sekolah: formData.nama, npsn: formData.npsn, kota_kabupaten: formData.kota, jenjang: formData.jenjang }).eq('school_id', formData.id!);
        }
        
        setEditingSchool(null);
        await fetchData();
        onDataChange();
        toast.success("Data sekolah berhasil disimpan.");
      } catch(error: any) {
        toast.error(`Gagal menyimpan: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
  };
  
  const handleResetAdminPassword = async (school: School) => {
    setConfirmAction({
      isOpen: true,
      title: 'Reset Password Admin',
      message: `Anda yakin ingin mereset atau membuat ulang password admin untuk ${school.nama}?`,
      type: 'warning',
      onConfirm: async () => {
        setConfirmAction(null);
        setIsLoading(true);
        try {
          const { data: admin, error: findError } = await supabase
            .from('teachers')
            .select('id, username')
            .eq('school_id', school.id)
            .eq('jabatan', 'Admin Sistem')
            .maybeSingle();

          if (findError && findError.code !== 'PGRST116') {
             throw findError;
          }

          const newPassword = Math.random().toString(36).slice(-8).toUpperCase();

          if (admin) {
            const { error: updateError } = await supabase
              .from('teachers')
              .update({ password: newPassword }) // Kirim plain text
              .eq('id', admin.id);

            if (updateError) throw updateError;
            
            setNewAdminCreds({ username: admin.username, pass: newPassword, npsn: school.npsn });
            toast.success('Password admin berhasil direset.');
          } else {
            const adminUsername = `admin.${school.npsn}`;
            const { error: createError } = await supabase.from('teachers').insert({
              school_id: school.id,
              nama: 'Admin Sekolah',
              nip: '',
              jabatan: 'Admin Sistem',
              username: adminUsername,
              password: newPassword, // Kirim plain text
              status: 'GTY',
              jenis_kelamin: 'Laki-laki',
              mata_pelajaran: []
            });

            if (createError) throw createError;

            setNewAdminCreds({ username: adminUsername, pass: newPassword, npsn: school.npsn });
            toast.success('Akun admin tidak ada, berhasil dibuatkan akun baru.');
          }
        } catch (error: any) {
          toast.error(`Operasi Gagal: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleSaveReseller = async (formData: Partial<Reseller>) => {
    setIsSaving(true);
    const isNew = !formData.id;
    const payload: Partial<Reseller> = { ...formData };

    try {
      if (isNew) {
        const newPassword = Math.random().toString(36).slice(-8).toUpperCase();
        payload.password = newPassword; // Kirim plain text
        const { error } = await supabase.from('resellers').insert(payload as any);
        if (error) throw error;
        setNewResellerCreds({ username: payload.username!, pass: newPassword });
        toast.success("Reseller baru berhasil dibuat.");
      } else {
        if (!payload.password) {
          delete payload.password; // Jangan update password jika kosong
        }
        const { error } = await supabase.from('resellers').update(payload).eq('id', payload.id!);
        if (error) throw error;
        toast.success("Data reseller berhasil diperbarui.");
      }
    } catch(error: any) {
      toast.error(`Gagal: ${error.message}`);
    } finally {
      setIsSaving(false); setEditingReseller(null); await fetchData();
    }
  };
  
  const handleToggleSchoolStatus = (school: School) => {
    setConfirmAction({ isOpen: true, title: `Konfirmasi Ubah Status`, type: 'warning',
      message: `Anda yakin ingin mengubah status sekolah ${school.nama} menjadi ${school.status === 'ACTIVE' ? 'NONAKTIF' : 'AKTIF'}?`,
      onConfirm: async () => {
        await supabase.from('schools').update({ status: school.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }).eq('id', school.id);
        await fetchData(); setConfirmAction(null);
        toast.info(`Status sekolah ${school.nama} diperbarui.`);
      }
    });
  };

  const handleApproveSchool = (school: School) => {
    setConfirmAction({ isOpen: true, title: 'Persetujuan Tenant', type: 'warning',
      message: `Setujui pendaftaran sekolah ${school.nama} dari reseller ${school.referral_id}? Sekolah akan menjadi AKTIF.`,
      onConfirm: async () => {
        await supabase.from('schools').update({ status: 'ACTIVE' }).eq('id', school.id);
        if (school.referral_id !== 'Pusat') {
          const { data: reseller } = await supabase.from('resellers').select('id').eq('username', school.referral_id).single();
          if (reseller) {
            await supabase.from('reseller_commissions').insert({
              reseller_id: reseller.id, school_id: school.id,
              commission_amount: 250000, status: 'unpaid'
            });
          }
        }
        await fetchData(); setConfirmAction(null);
        toast.success("Sekolah berhasil disetujui.");
      }
    });
  };

  const handleDelete = (type: 'school' | 'reseller', item: any) => {
    setConfirmAction({ isOpen: true, title: `Hapus Data ${type === 'school' ? 'Tenant' : 'Reseller'}`, type: 'danger',
      message: `TINDAKAN INI PERMANEN. Seluruh data terkait untuk ${item.nama} akan dihapus. Lanjutkan?`,
      onConfirm: async () => {
        const table = type === 'school' ? 'schools' : 'resellers';
        await supabase.from(table).delete().eq('id', item.id);
        await fetchData(); setConfirmAction(null);
        if (type === 'school') onDataChange();
        toast.success(`Data ${item.nama} telah dihapus.`);
      }
    });
  };

  const filteredSchools = useMemo(() => schools.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()) || s.npsn.includes(search)), [schools, search]);
  const globalStats = useMemo(() => ({ totalSchools: schools.length, activeSchools: schools.filter(s => s.status === 'ACTIVE').length, totalStudents: schools.reduce((acc, school) => acc + (school.students?.[0]?.count || 0), 0) }), [schools]);
  
  const StatusBadge: React.FC<{status: School['status'] | boolean}> = ({ status }) => {
    if (typeof status === 'boolean') status = status ? 'ACTIVE' : 'INACTIVE';
    const styles = { ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200', INACTIVE: 'bg-gray-100 text-gray-400 border-gray-200', PENDING: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' };
    return <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${styles[status as keyof typeof styles]}`}>{status}</span>;
  };

  const renderContent = () => {
    switch(activePath) {
      case '/': return ( <div className="space-y-8 animate-in fade-in"><h1 className="text-2xl font-black text-gray-800">Dashboard Global</h1><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="gov-card p-6 border-l-4 border-blue-600"><div className="flex justify-between items-start"><div><p className="text-[10px] font-black uppercase text-gray-400">Total Sekolah</p><h3 className="text-4xl font-black text-gray-800">{globalStats.totalSchools}</h3></div><Building2 size={24} className="text-blue-200"/></div></div><div className="gov-card p-6 border-l-4 border-emerald-600"><div className="flex justify-between items-start"><div><p className="text-[10px] font-black uppercase text-gray-400">Tenant Aktif</p><h3 className="text-4xl font-black text-gray-800">{globalStats.activeSchools}</h3></div><ShieldCheck size={24} className="text-emerald-200"/></div></div><div className="gov-card p-6 border-l-4 border-indigo-600"><div className="flex justify-between items-start"><div><p className="text-[10px] font-black uppercase text-gray-400">Total Siswa Platform</p><h3 className="text-4xl font-black text-gray-800">{globalStats.totalStudents.toLocaleString('id-ID')}</h3></div><Users size={24} className="text-indigo-200"/></div></div></div></div>);
      case '/manajemen-tenant': return (<div className="space-y-6 animate-in fade-in"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Manajemen Tenant Sekolah</h1><button onClick={() => setEditingSchool({})} className="gov-btn gov-btn-primary text-[10px]"><Plus size={16} /> Tambah</button></div><div className="gov-card p-4"><div className="relative max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari sekolah..." className="gov-input w-full pl-12" /></div></div>{isLoading ? <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gray-300" /></div> : (<div className="gov-table-container"><table className="gov-table"><thead><tr><th>Nama Sekolah</th><th>Referral</th><th className="text-center">Langganan</th><th className="text-center">Status</th><th className="text-right">Aksi</th></tr></thead><tbody>{filteredSchools.map(s => (<tr key={s.id} className="group"><td><div className="flex flex-col"><span className="font-black text-sm text-gray-800 uppercase tracking-tight">{s.nama}</span><span className="text-[10px] text-gray-400 font-bold uppercase">{s.kota}</span></div></td><td><span className={`font-mono text-[10px] font-bold ${s.referral_id === 'Pusat' ? 'text-emerald-700' : 'text-blue-700'}`}>{s.referral_id}</span></td><td className="text-center"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase`}>{s.subscription_plan}</span></td><td className="text-center"><StatusBadge status={s.status} /></td><td className="text-right"><div className="flex justify-end gap-0.5 opacity-20 group-hover:opacity-100 transition-opacity">{s.status === 'PENDING' && <button onClick={() => handleApproveSchool(s)} title="Setujui" className="p-2 hover:bg-emerald-50 rounded-sm text-emerald-500"><CheckCircle size={16}/></button>}{s.status !== 'PENDING' && <button onClick={() => handleToggleSchoolStatus(s)} title={s.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'} className="p-2 hover:bg-gray-100 rounded-sm text-gray-400">{s.status === 'ACTIVE' ? <PowerOff size={16} className="hover:text-red-500"/> : <Power size={16} className="hover:text-emerald-500"/>}</button>}<button onClick={() => handleResetAdminPassword(s)} title="Reset Password Admin" className="p-2 hover:bg-amber-50 rounded-sm text-gray-400 hover:text-amber-600"><Key size={16}/></button><button onClick={() => setEditingSchool(s)} title="Edit" className="p-2 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-emerald-500"><Edit2 size={16}/></button><button onClick={() => handleDelete('school', s)} title="Hapus" className="p-2 hover:bg-red-50 rounded-sm text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></div></td></tr>))}</tbody></table></div>)}</div>);
      case '/manajemen-reseller': return (<div className="space-y-6 animate-in fade-in"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Manajemen Reseller</h1><button onClick={() => setEditingReseller({})} className="gov-btn gov-btn-primary text-[10px]"><Plus size={16} /> Tambah</button></div>{isLoading ? <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gray-300" /></div> : (<div className="gov-table-container"><table className="gov-table"><thead><tr><th>Nama & Kota Reseller</th><th>Kontak</th><th>Username</th><th className="text-center">Status</th><th className="text-right">Aksi</th></tr></thead><tbody>{resellers.map(r => (<tr key={r.id} className="group"><td><div className="flex flex-col"><span className="font-black text-sm text-gray-800 uppercase tracking-tight">{r.nama}</span><span className="text-[10px] text-gray-400 font-bold uppercase">{r.kota}</span></div></td><td><div className="flex flex-col"><span className="text-xs font-bold text-gray-500">{r.email}</span><span className="text-[10px] text-gray-400 font-mono">{r.telepon}</span></div></td><td><span className="font-mono text-[10px] font-bold text-emerald-700">{r.username}</span></td><td className="text-center"><StatusBadge status={r.is_active} /></td><td className="text-right"><div className="flex justify-end gap-0.5 opacity-20 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditingReseller(r)} title="Edit" className="p-2 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-emerald-500"><Edit2 size={16}/></button><button onClick={() => handleDelete('reseller', r)} title="Hapus" className="p-2 hover:bg-red-50 rounded-sm text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></div></td></tr>))}</tbody></table></div>)}</div>);
      case '/bank-soal-global': return <GlobalBankManagement />;
      case '/billing': return <BillingManagement />;
      case '/monitoring-sumberdaya': return (<div className="animate-in fade-in">{isLoading ? <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gray-300" /></div> : <ResourceMonitor stats={dbStats} onRefresh={fetchMonitoringData} isRefreshing={isLoading} />}</div>);
      default: return null;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={() => onLogout()} onNavigate={handleNavigate} user={user} schoolName="SUPERADMIN PORTAL" />
      <div className="flex flex-1 pt-20 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} isCollapsed={isSidebarCollapsed} activePath={activePath} menuItems={SUPERADMIN_MENU_ITEMS} onNavigate={handleNavigate} onLogout={() => onLogout()} onCloseMobile={() => setIsSidebarOpen(false)} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} overflow-hidden`}>
           <div className="hidden md:block shrink-0"><Breadcrumb items={useMemo(() => { const c = SUPERADMIN_MENU_ITEMS.find(i=>i.path===activePath); return c&&c.path!=='/'?[{label:c.label}]:[]}, [activePath])} onNavigateHome={() => handleNavigate('/')} /></div>
           <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto scrollbar-hide">{renderContent()}</div>
           <footer className="shrink-0 py-4 px-10 text-center bg-white border-t border-gray-200"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emes CBT &copy; {new Date().getFullYear()} Emes EduTech - Superadmin Portal</p></footer>
        </main>
      </div>
      {editingSchool && <SchoolForm school={editingSchool} onSave={handleSaveSchool} onCancel={() => setEditingSchool(null)} isSaving={isSaving} />}
      {editingReseller && <ResellerForm reseller={editingReseller} onSave={handleSaveReseller} onCancel={() => setEditingReseller(null)} />}
      {confirmAction?.isOpen && <ConfirmModal title={confirmAction.title} message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} type={confirmAction.type} />}
      {newAdminCreds && <NewCredentialsModal title="Kredensial Admin Sekolah Dibuat/Direset" creds={newAdminCreds} onClose={() => setNewAdminCreds(null)} actionButton={{ label: 'KUNJUNGI', onClick: () => { setNewAdminCreds(null); onLogout(`/${newAdminCreds.npsn}`, false); }}} />}
      {newResellerCreds && <NewCredentialsModal title="Kredensial Reseller Dibuat" creds={newResellerCreds} onClose={() => setNewResellerCreds(null)} />}
    </div>
  );
};

const ResourceMonitor: React.FC<{stats: any; onRefresh: () => void; isRefreshing: boolean}> = ({ stats, onRefresh, isRefreshing }) => {
  const MAU_LIMIT = 50000;
  
  const safeStats = stats && typeof stats === 'object' ? stats : {};

  const totalUsers = (safeStats.students || 0) + (safeStats.teachers || 0);
  
  const totalRows = Object.values(safeStats).reduce<number>((acc, val) => {
    return acc + (typeof val === 'number' ? val : 0);
  }, 0);

  const mauUsage = totalUsers > 0 ? Math.min(100, (totalUsers / MAU_LIMIT) * 100) : 0;
  
  const StatCard: React.FC<{icon: React.ReactNode; label: string; value: string; sub?: string}> = ({icon, label, value, sub}) => (<div className="gov-card p-6 flex items-start gap-4"><div className="p-3 bg-gray-100 text-emerald-700 rounded-sm">{icon}</div><div><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</p><p className="text-3xl font-black text-gray-800">{value}</p>{sub && <p className="text-[9px] font-bold text-gray-400 mt-1">{sub}</p>}</div></div>);
  
  const ProgressBar: React.FC<{label: string; value: number; limit: number; usage: number}> = ({label, value, limit, usage}) => (<div className="gov-card p-6"><div className="flex justify-between items-center mb-2"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</p><p className="text-[10px] font-black text-emerald-800">{usage.toFixed(2)}%</p></div><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-emerald-600 h-2.5 rounded-full" style={{width: `${usage}%`}}></div></div><p className="text-right text-[9px] font-bold text-gray-400 mt-2">{value.toLocaleString('id-ID')} / {limit.toLocaleString('id-ID')}</p></div>);
  
  if (!stats) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gray-300" /></div>;
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Monitoring Sumber Daya Supabase</h1>
        <button onClick={() => onRefresh()} disabled={isRefreshing} className="gov-btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-[10px]">
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'MEMUAT...' : 'REFRESH'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <StatCard icon={<Database size={24}/>} label="Total Baris Database" value={totalRows.toLocaleString('id-ID')} sub="Proxy untuk estimasi ukuran database (Limit: 500 MB)" />
          <ProgressBar label="Pengguna Aktif Bulanan (MAU)" value={totalUsers} limit={MAU_LIMIT} usage={mauUsage} />
        </div>
        <div className="gov-card p-6 space-y-4">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight border-b pb-3">Rincian Baris per Tabel</h3>
          {Object.entries(safeStats)
            .sort(([, a], [, b]) => ((typeof b === 'number' ? b : 0) - (typeof a === 'number' ? a : 0)))
            .map(([key, value]) => (
              <div key={key} className="flex justify-between items-center bg-gray-50 p-3 rounded-sm">
                <p className="text-[10px] font-mono font-bold text-gray-500">{key}</p>
                <p className="text-sm font-black text-gray-800">
                  {typeof value === 'number' ? value.toLocaleString('id-ID') : 'N/A'} baris
                </p>
              </div>
            ))}
          <div className="pt-4 border-t">
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="gov-btn bg-emerald-50 text-emerald-700 text-[10px] w-full">Buka <ArrowRight size={14} /></a>
          </div>
        </div>
      </div>
    </div>
  );
};

const SchoolForm: React.FC<{ school: Partial<School> | null, onSave: (data: Partial<School>) => void, onCancel: () => void, isSaving: boolean }> = ({ school, onSave, onCancel, isSaving }) => {
  const [form, setForm] = useState<Partial<School>>(() => school?.id ? school : { nama: '', npsn: '', kota: '', jenjang: 'SMP/MTs', status: 'ACTIVE', subscription_plan: 'BASIC', quota_limit: 100 });
  return ( <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl"><div className="flex items-center justify-between p-6 border-b"><h3 className="text-sm font-black uppercase">{school?.id ? 'Edit Tenant' : 'Tenant Baru'}</h3><button onClick={() => onCancel()}><X size={20}/></button></div><form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-8 space-y-6"><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-bold uppercase">Nama Sekolah</label><input required value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">NPSN</label><input required value={form.npsn} onChange={e => setForm({...form, npsn: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">Kota</label><input required value={form.kota} onChange={e => setForm({...form, kota: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">Jenjang</label><select required value={form.jenjang} onChange={e => setForm({...form, jenjang: e.target.value})} className="gov-input w-full"><option value="SD/MI">SD/MI</option><option value="SMP/MTs">SMP/MTs</option><option value="SMA/SMK/MA">SMA/SMK/MA</option></select></div></div><div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => onCancel()} className="gov-btn gov-btn-secondary">Batal</button><button type="submit" disabled={isSaving} className="gov-btn gov-btn-primary w-28">{isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Simpan'}</button></div></form></div></div> );
};

const ResellerForm: React.FC<{ reseller: Partial<Reseller> | null, onSave: (data: Partial<Reseller>) => void, onCancel: () => void }> = ({ reseller, onSave, onCancel }) => {
  const [form, setForm] = useState<Partial<Reseller>>(() => reseller?.id ? { ...reseller, password: '' } : { nama: '', email: '', telepon: '', kota: '', alamat: '', is_active: true, username: `MSCBT-R${Math.floor(1000 + Math.random() * 9000)}` });
  return ( <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl"><div className="flex items-center justify-between p-6 border-b"><h3 className="text-sm font-black uppercase">{reseller?.id ? 'Edit Reseller' : 'Reseller Baru'}</h3><button onClick={() => onCancel()}><X size={20}/></button></div><form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-8 space-y-6"><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-bold uppercase">Nama</label><input required value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">Email</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">Telepon</label><input required value={form.telepon} onChange={e => setForm({...form, telepon: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">Kota</label><input required value={form.kota} onChange={e => setForm({...form, kota: e.target.value})} className="gov-input w-full" /></div><div className="col-span-2"><label className="text-[10px] font-bold uppercase">Alamat</label><input value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">Username</label><input required readOnly value={form.username} className="gov-input w-full font-mono bg-gray-100" /></div><div><label className="text-[10px] font-bold uppercase">Password</label><input type="password" placeholder={reseller?.id ? "Isi untuk mengubah" : "Akan digenerate otomatis"} onChange={e => setForm({...form, password: e.target.value})} className="gov-input w-full" /></div></div><div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => onCancel()} className="gov-btn gov-btn-secondary">Batal</button><button type="submit" className="gov-btn gov-btn-primary">Simpan</button></div></form></div></div> );
};

const NewCredentialsModal: React.FC<{title: string; creds: {username: string; pass: string;}; onClose: () => void; actionButton?: { label: string; onClick: () => void; };}> = ({ title, creds, onClose, actionButton }) => {
  const [copyStatus, setCopyStatus] = useState('Salin');
  const copyAllToClipboard = async () => {
    const textToCopy = `Username: ${creds.username}\nPassword: ${creds.pass}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus('Disalin!');
      setTimeout(() => { setCopyStatus('Salin'); }, 2000);
    } catch (err) { console.error('Failed to copy credentials', err); }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"><div className="bg-white rounded-sm shadow-2xl w-full max-w-md animate-in zoom-in duration-200 border border-gray-300"><div className="p-6 text-center border-b bg-gray-50"><CheckCircle size={32} className="mx-auto text-emerald-600 mb-4" /><h3 className="text-sm font-black uppercase text-gray-800 tracking-tight">{title}</h3></div><div className="p-8 space-y-4"><p className="text-[10px] font-bold uppercase text-gray-400">Silakan salin dan teruskan kredensial berikut ke pihak terkait.</p><div><label className="text-[9px] font-bold uppercase text-gray-500">Username</label><input readOnly value={creds.username} className="gov-input w-full font-mono bg-gray-100" /></div><div><label className="text-[9px] font-bold uppercase text-gray-500">Password</label><input readOnly value={creds.pass} className="gov-input w-full font-mono bg-gray-100" /></div><button type="button" onClick={copyAllToClipboard} className="!mt-6 w-full gov-btn bg-gray-800 text-white hover:bg-black transition-colors"><Copy size={14} /> {copyStatus}</button></div><div className={`p-4 bg-gray-50 border-t flex ${actionButton ? 'justify-between' : 'justify-end'} items-center`}>{actionButton ? (<button onClick={() => actionButton.onClick()} className="gov-btn bg-white text-emerald-800 border border-emerald-200 text-[10px] hover:bg-emerald-50">{actionButton.label}<ArrowRight size={14} /></button>) : <div />}<button onClick={() => onClose()} className="gov-btn gov-btn-primary text-[10px]">Selesai</button></div></div></div>
  );
};

export default SuperAdminPortal;
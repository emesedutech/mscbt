import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.ts';
import { 
  Building2, Plus, Edit2, Loader2, Save, X, Search, 
  ShieldCheck, Copy, CheckCircle, Users, Handshake,
  Power, PowerOff, Key, Database, Trash2, AlertTriangle, Check, ArrowRight,
  DollarSign, FileText
} from 'lucide-react';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import Breadcrumb from './Breadcrumb.tsx';
import { School, Reseller, ResellerCommission } from '../types.ts';
import { RESELLER_MENU_ITEMS } from '../constants';
import { useToast } from '../hooks/useToast.ts';

interface ResellerPortalProps {
  user: Reseller;
  onLogout: (path?: string, confirm?: boolean) => void;
  onNavigate: (path: string) => void;
}

const getResellerInitialPath = () => {
    const path = window.location.pathname;
    if (path.startsWith('/reseller')) {
        const subpath = path.substring(9); // Hapus '/reseller'
        return subpath || '/';
    }
    return '/';
};

const ResellerPortal: React.FC<ResellerPortalProps> = ({ user, onLogout, onNavigate }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [commissions, setCommissions] = useState<ResellerCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePath, setActivePath] = useState(getResellerInitialPath());
  const toast = useToast();

  const [editingSchool, setEditingSchool] = useState<Partial<School> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newAdminCreds, setNewAdminCreds] = useState<{username: string, pass: string, npsn: string} | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*, students(count)')
        .eq('referral_id', user.username)
        .order('nama', { ascending: true });
      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);

      const { data: commissionsData, error: commissionsError } = await supabase
        .from('reseller_commissions')
        .select('*, schools(nama)')
        .eq('reseller_id', user.id)
        .order('created_at', { ascending: false });
      if (commissionsError) throw commissionsError;
      setCommissions(commissionsData || []);
    } catch (error: any) {
      toast.error(`Gagal memuat data mitra: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.username, user.id]);
  
  const handleNavigate = (path: string) => {
    const newPath = path === '/' ? '/reseller' : `/reseller${path}`;
    const internalPath = path;
    onNavigate(newPath);
    setActivePath(internalPath);
    setIsSidebarOpen(false);
  };

  const handleSaveSchool = async (formData: Partial<School>) => {
      setIsSaving(true);
      try {
        const schoolPayload = {
          nama: formData.nama, 
          npsn: formData.npsn, 
          kota: formData.kota, 
          jenjang: formData.jenjang,
          subdomain: formData.npsn, 
          subscription_plan: 'BASIC', 
          quota_limit: 100,
          status: 'PENDING',
          referral_id: user.username,
        };

        const { data: newSchool, error } = await supabase.from('schools').insert(schoolPayload).select().single();
        if (error || !newSchool) throw error;
        
        await supabase.from('school_profiles').insert({ school_id: newSchool.id, nama_sekolah: newSchool.nama, npsn: newSchool.npsn, jenjang: formData.jenjang, kota_kabupaten: newSchool.kota, status: 'Negeri' });
        
        const adminUsername = `admin.${newSchool.npsn}`;
        const adminPassword = Math.random().toString(36).slice(-8).toUpperCase();
        const { error: adminError } = await supabase.from('teachers').insert({ school_id: newSchool.id, nama: 'Admin Sekolah', nip: '', jabatan: 'Admin Sistem', username: adminUsername, password: adminPassword, status: 'GTY', jenis_kelamin: 'Laki-laki', mata_pelajaran: [] });
        
        if (adminError) throw adminError;

        setNewAdminCreds({ username: adminUsername, pass: adminPassword, npsn: newSchool.npsn });
        setEditingSchool(null); 
        await fetchData();
        toast.success('Sekolah berhasil didaftarkan & menunggu persetujuan Superadmin.');

      } catch (err: any) {
        toast.error(`Pendaftaran gagal: ${err.message}`);
      } finally {
        setIsSaving(false);
      }
  };
  
  const filteredSchools = useMemo(() => schools.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()) || s.npsn.includes(search)), [schools, search]);
  
  const resellerStats = useMemo(() => {
    const totalEarned = commissions.reduce((acc, c) => acc + c.commission_amount, 0);
    const unpaidBalance = commissions
      .filter(c => c.status === 'unpaid')
      .reduce((acc, c) => acc + c.commission_amount, 0);
    return { totalEarned, unpaidBalance };
  }, [commissions]);

  const StatusBadge: React.FC<{status: School['status'] | ResellerCommission['status']}> = ({ status }) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      INACTIVE: 'bg-gray-100 text-gray-400 border-gray-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${styles[status]}`}>{status}</span>;
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const renderContent = () => {
    switch(activePath) {
      case '/': return ( <div className="space-y-8 animate-in fade-in">
        <h1 className="text-2xl font-black text-gray-800">Dashboard Mitra</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="gov-card p-6 border-l-4 border-blue-600"><div className="flex justify-between items-start"><div><p className="text-[10px] font-black uppercase text-gray-400">Total Sekolah Mitra</p><h3 className="text-4xl font-black text-gray-800">{schools.length}</h3></div><Building2 size={24} className="text-blue-200"/></div></div>
            <div className="gov-card p-6 border-l-4 border-emerald-600"><div className="flex justify-between items-start"><div><p className="text-[10px] font-black uppercase text-gray-400">Total Komisi Didapat</p><h3 className="text-3xl font-black text-gray-800">{formatCurrency(resellerStats.totalEarned)}</h3></div><FileText size={24} className="text-emerald-200"/></div></div>
            <div className="gov-card p-6 border-l-4 border-amber-500"><div className="flex justify-between items-start"><div><p className="text-[10px] font-black uppercase text-gray-400">Saldo Komisi Belum Dibayar</p><h3 className="text-3xl font-black text-amber-800">{formatCurrency(resellerStats.unpaidBalance)}</h3></div><DollarSign size={24} className="text-amber-200"/></div></div>
        </div>
      </div>);
      case '/sekolah': return (
          <div className="space-y-6 animate-in fade-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Manajemen Sekolah Mitra</h1><button onClick={() => setEditingSchool({})} className="gov-btn gov-btn-primary text-[10px]"><Plus size={16} /> Daftarkan Sekolah</button></div>
             <div className="gov-card p-4"><div className="relative max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari sekolah..." className="gov-input w-full pl-12" /></div></div>
             {isLoading ? <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gray-300" /></div> : (
              <div className="gov-table-container"><table className="gov-table">
                  <thead><tr><th>Nama Sekolah</th><th>Kota</th><th className="text-center">Langganan</th><th className="text-center">Status</th></tr></thead>
                  <tbody>{filteredSchools.map(s => (
                    <tr key={s.id}>
                        <td><span className="font-black text-sm text-gray-800 uppercase tracking-tight">{s.nama}</span></td>
                        <td><span className="text-[10px] text-gray-400 font-bold uppercase">{s.kota}</span></td>
                        <td className="text-center"><span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase">{s.subscription_plan}</span></td>
                        <td className="text-center"><StatusBadge status={s.status} /></td>
                      </tr>
                    ))}</tbody>
                </table></div>)}
          </div>);
      case '/komisi': return (
          <div className="space-y-6 animate-in fade-in">
             <h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Riwayat Komisi</h1>
             {isLoading ? <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gray-300" /></div> : (
              <div className="gov-table-container"><table className="gov-table">
                  <thead><tr><th>Tanggal Daftar</th><th>Sekolah Terdaftar</th><th className="text-center">Jumlah Komisi</th><th className="text-center">Status</th><th>Tanggal Dibayar</th></tr></thead>
                  <tbody>{commissions.map(c => (
                    <tr key={c.id}>
                        <td><span className="text-xs font-bold">{new Date(c.created_at).toLocaleDateString('id-ID')}</span></td>
                        <td><span className="font-black text-sm text-gray-800 uppercase tracking-tight">{c.schools?.nama || 'N/A'}</span></td>
                        <td className="text-center"><span className="text-sm font-bold">{formatCurrency(c.commission_amount)}</span></td>
                        <td className="text-center"><StatusBadge status={c.status} /></td>
                        <td><span className="text-xs font-bold">{c.paid_at ? new Date(c.paid_at).toLocaleDateString('id-ID') : '-'}</span></td>
                      </tr>
                    ))}</tbody>
                </table></div>)}
          </div>);
      default: return null;
    }
  };


  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={onLogout} onNavigate={() => {}} user={user} schoolName="PORTAL MITRA RESELLER" />
      <div className="flex flex-1 pt-20 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} isCollapsed={isSidebarCollapsed} activePath={activePath} menuItems={RESELLER_MENU_ITEMS} onNavigate={handleNavigate} onLogout={onLogout} onCloseMobile={() => setIsSidebarOpen(false)} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} overflow-hidden`}>
           <div className="hidden md:block shrink-0"><Breadcrumb items={useMemo(() => { const c = RESELLER_MENU_ITEMS.find(i=>i.path===activePath); return c&&c.path!=='/'?[{label:c.label}]:[]}, [activePath])} onNavigateHome={() => handleNavigate('/')} /></div>
           <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto scrollbar-hide">{renderContent()}</div>
           <footer className="shrink-0 py-4 px-10 text-center bg-white border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Emes CBT &copy; {new Date().getFullYear()} Emes EduTech - Portal Mitra
            </p>
          </footer>
        </main>
      </div>
      {editingSchool && <SchoolForm school={editingSchool} onSave={handleSaveSchool} onCancel={() => setEditingSchool(null)} />}
      {newAdminCreds && <NewCredentialsModal title="Kredensial Admin Sekolah Dibuat" creds={newAdminCreds} onClose={() => setNewAdminCreds(null)} toast={toast} />}
    </div>
  );
};

const SchoolForm: React.FC<{ school: Partial<School> | null, onSave: (data: Partial<School>) => void, onCancel: () => void }> = ({ school, onSave, onCancel }) => {
  const [form, setForm] = useState<Partial<School>>({ nama: '', npsn: '', kota: '', jenjang: 'SMP/MTs' });
  return ( <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl"><div className="flex items-center justify-between p-6 border-b"><h3 className="text-sm font-black uppercase">Pendaftaran Tenant Baru</h3><button onClick={() => onCancel()}><X size={20}/></button></div><form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-8 space-y-6"><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-bold uppercase">Nama Sekolah</label><input required value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">NPSN</label><input required value={form.npsn} onChange={e => setForm({...form, npsn: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">Kota</label><input required value={form.kota} onChange={e => setForm({...form, kota: e.target.value})} className="gov-input w-full" /></div><div><label className="text-[10px] font-bold uppercase">Jenjang</label><select required value={form.jenjang} onChange={e => setForm({...form, jenjang: e.target.value})} className="gov-input w-full"><option value="SD/MI">SD/MI</option><option value="SMP/MTs">SMP/MTs</option><option value="SMA/SMK/MA">SMA/SMK/MA</option></select></div></div><div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => onCancel()} className="gov-btn gov-btn-secondary">Batal</button><button type="submit" className="gov-btn gov-btn-primary">Kirim Pendaftaran</button></div></form></div></div> );
};

const NewCredentialsModal: React.FC<{title: string; creds: {username: string; pass: string;}; onClose: () => void; toast: any;}> = ({ title, creds, onClose, toast }) => {
  const [copyStatus, setCopyStatus] = useState('Salin');

  const copyAllToClipboard = async () => {
    const textToCopy = `Username: ${creds.username}\nPassword: ${creds.pass}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus('Disalin!');
      setTimeout(() => setCopyStatus('Salin'), 2000);
    } catch(err) {
      toast.error('Gagal menyalin kredensial ke clipboard.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"><div className="bg-white rounded-sm shadow-2xl w-full max-w-md animate-in zoom-in duration-200 border border-gray-300"><div className="p-6 text-center border-b bg-gray-50"><CheckCircle size={32} className="mx-auto text-emerald-600 mb-4" /><h3 className="text-sm font-black uppercase text-gray-800 tracking-tight">{title}</h3></div><div className="p-8 space-y-4"><p className="text-[10px] font-bold uppercase text-gray-400">Sekolah berhasil didaftarkan dengan status PENDING. Teruskan kredensial berikut ke Admin Sekolah.</p><div><label className="text-[9px] font-bold uppercase text-gray-500">Username</label><input readOnly value={creds.username} className="gov-input w-full font-mono bg-gray-100" /></div><div><label className="text-[9px] font-bold uppercase text-gray-500">Password</label><input readOnly value={creds.pass} className="gov-input w-full font-mono bg-gray-100" /></div><button type="button" onClick={() => copyAllToClipboard()} className="!mt-6 w-full gov-btn bg-gray-800 text-white hover:bg-black transition-colors"><Copy size={14} /> {copyStatus}</button></div><div className="p-4 bg-gray-50 border-t flex justify-end items-center">
      <button onClick={() => onClose()} className="gov-btn gov-btn-primary text-[10px]">Selesai</button>
    </div></div></div>
  );
};

export default ResellerPortal;
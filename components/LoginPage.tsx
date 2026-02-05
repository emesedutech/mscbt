import React, { useState } from 'react';
import { Loader2, AlertCircle, Eye, EyeOff, Building2, User, Lock, Wifi, ShieldCheck, BarChart3, Database, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';
import { LOGO_URL } from '../constants.tsx';
import UserGuideModal from './UserGuideModal.tsx';

interface LoginPageProps {
  onLoginSuccess: (user: any, role: 'admin' | 'guru' | 'proktor' | 'pengawas' | 'siswa' | 'super_admin') => void;
  npsnFromUrl?: string | null;
}

const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
  <div className="flex gap-4 items-start">
    <div className="bg-teal-500/10 p-2.5 rounded-lg border border-teal-500/20 flex-shrink-0">{icon}</div>
    <div>
      <h3 className="font-bold text-gray-100 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-300/80 leading-snug">{description}</p>
    </div>
  </div>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, npsnFromUrl }) => {
  const [npsn, setNpsn] = useState(npsnFromUrl || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!npsn || !username || !password) {
      setError('NPSN, Username, dan Password wajib diisi.');
      return;
    }
    
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('login_cbt_user', {
          npsn_param: npsn,
          username_param: username,
          password_param: password
      });

      if (rpcError) {
          throw new Error("Terjadi kesalahan pada server saat login.");
      }

      if (!data || !data.user) {
          throw new Error('Kombinasi NPSN, Username, atau Password salah.');
      }

      // Hapus password dari objek user sebelum disimpan di state
      delete data.user.password;
      
      // data from RPC is { user: {...}, role: '...' }
      onLoginSuccess(data.user, data.role);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      {showGuide && <UserGuideModal onClose={() => setShowGuide(false)} />}
      <div
        className="min-h-screen w-full flex items-center justify-center p-6 md:p-8 bg-cover bg-center"
        style={{ backgroundImage: 'url(/login-bg.png)' }}
      >
        <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 md:gap-20 items-center z-10">
          <div className="hidden lg:block lg:col-span-3 bg-gray-900/40 backdrop-blur-xl border border-gray-400/20 shadow-2xl rounded-2xl p-10">
              <h2 className="text-4xl font-black tracking-tight text-white">
                Keunggulan Platform Emes CBT
              </h2>
              <p className="mt-3 text-teal-300 leading-relaxed text-lg">
                Platform asesmen digital yang adaptif, aman, dan komprehensif untuk kebutuhan evaluasi pendidikan modern.
              </p>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                  <FeatureItem 
                    icon={<Wifi size={24} className="text-teal-300" />}
                    title="Mode Ujian Hybrid"
                    description="Lancar online & offline, stabil walau koneksi internet buruk."
                  />
                  <FeatureItem 
                    icon={<ShieldCheck size={24} className="text-teal-300" />}
                    title="Keamanan Berlapis"
                    description="Dilengkapi token sesi dan pengawasan proktor untuk cegah kecurangan."
                  />
                  <FeatureItem 
                    icon={<BarChart3 size={24} className="text-teal-300" />}
                    title="Analisis Psikometrik"
                    description="Dapatkan laporan analisis butir soal dan tingkat kesukaran otomatis."
                  />
                  <FeatureItem 
                    icon={<Database size={24} className="text-teal-300" />}
                    title="Bank Soal Terpusat"
                    description="Kelola ribuan soal dalam satu wadah terstruktur berdasarkan mapel."
                  />
              </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200/50 shadow-2xl p-8">
              <div className="text-center mb-8">
                <img src={LOGO_URL} alt="Logo" className="w-12 h-12 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800">Login Peserta & Pengelola</h1>
                <p className="text-sm text-gray-500 mt-1">Gunakan kredensial yang telah diberikan oleh Admin.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 rounded-md">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">NPSN (ID Sekolah)</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={npsn}
                      onChange={e => setNpsn(e.target.value)}
                      className="gov-input pl-11"
                      placeholder="Masukkan NPSN"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username / NIS</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="gov-input pl-11"
                      placeholder="Username atau NIS"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="gov-input pl-11 pr-10"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={loading} className="w-full h-12 gov-btn gov-btn-primary text-sm">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : "Masuk"}
                  </button>
                </div>
              </form>
            </div>
            <div className="text-center mt-8">
              <button 
                onClick={() => setShowGuide(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
              >
                <BookOpen size={16} />
                Panduan Pengguna
              </button>
              <p className="text-center text-xs text-gray-400 mt-4">
                Emes CBT &copy; {new Date().getFullYear()} Emes EduTech
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
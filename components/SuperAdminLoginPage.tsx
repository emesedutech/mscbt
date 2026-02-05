import React, { useState } from 'react';
import { Loader2, AlertCircle, Eye, EyeOff, User, Lock } from 'lucide-react';
import { LOGO_URL } from '../constants.tsx';
import { supabase } from '../lib/supabase.ts';

interface SuperAdminLoginPageProps {
  onLoginSuccess: (user: any, role: 'super_admin' | 'reseller') => void;
}

const SuperAdminLoginPage: React.FC<SuperAdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('login_global_user', {
        username_param: username.trim(), // Tambahkan trim untuk keamanan
        password_param: password.trim()
      });

      if (rpcError) throw rpcError;

      // Normalisasi data jika Supabase mengembalikan array (sering terjadi di RPC)
      const result = Array.isArray(data) ? data[0] : data;

      if (!result || !result.user) {
        throw new Error('AKSES DITOLAK. KREDENSIAL TIDAK VALID.');
      }
      
      // Hapus password dari objek user sebelum disimpan di state
      delete result.user.password;
      
      // Pastikan data user lengkap untuk UI
      const userData = {
        ...result.user,
        nama: result.role === 'super_admin' ? 'Global Superadmin' : result.user.nama,
        jabatan: result.role === 'super_admin' ? 'Super Admin' : 'Mitra Reseller'
      };

      onLoginSuccess(userData, result.role);
    
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan otentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gray-50" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/subtle-stripes.png")' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <img src={LOGO_URL} alt="Logo" className="w-10 h-10 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest">Otorisasi Global</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-400 text-red-600 text-xs font-bold flex items-center gap-2 rounded-md">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-wider">Master Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  className="gov-input pl-11 font-semibold" 
                  placeholder="superadmin" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-wider">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="gov-input pl-11 pr-10 font-mono" 
                  placeholder="••••••••••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full h-12 gov-btn gov-btn-primary text-sm font-bold tracking-wider">
                {loading ? <Loader2 size={20} className="animate-spin" /> : "VERIFIKASI DATABASE"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
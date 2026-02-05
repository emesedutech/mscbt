
import React, { useState } from 'react';
import { Menu, User, ChevronDown, LogOut, Settings } from 'lucide-react';
import { LOGO_URL } from '../constants.tsx';

interface HeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  user: any;
  schoolName?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, onLogout, onNavigate, user, schoolName }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    onLogout();
  };

  const handleAction = (path: string) => {
    setIsUserMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[#065F46] text-white z-50 flex items-center px-4 md:px-6 border-b border-[#064E3B] shadow-sm">
      <button 
        onClick={onMenuToggle}
        className="mr-3 md:mr-4 p-2 hover:bg-[#064E3B] rounded transition-colors md:hidden"
        aria-label="Toggle Menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-3 md:gap-4">
        <img 
          src={LOGO_URL} 
          alt="Logo" 
          className="w-9 h-9 object-contain logo-inverse" 
        />
        <div>
          <h1 className="text-sm md:text-base font-semibold uppercase text-white leading-tight tracking-wider">
            {schoolName || "Emes CBT"}
          </h1>
          <p className="text-[10px] text-emerald-300/80 font-normal uppercase tracking-wider leading-tight">Aplikasi CBT</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 md:gap-3 p-1.5 hover:bg-white/10 rounded transition-all"
            aria-haspopup="true"
            aria-expanded={isUserMenuOpen}
          >
            <div className="w-8 h-8 rounded bg-[#022C22]/50 border border-white/10 flex items-center justify-center">
              <User size={16} className="text-emerald-300" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[9px] font-semibold text-emerald-300 uppercase tracking-wider leading-none mb-0.5">{user?.jabatan || 'Pengguna'}</p>
              <p className="text-sm font-semibold text-white leading-none">{user?.nama || 'Tanpa Nama'}</p>
            </div>
            <ChevronDown size={14} className={`text-emerald-300 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1.5 text-gray-800 border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
              role="menu"
              aria-orientation="vertical"
            >
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Login ID</p>
                <p className="text-xs font-semibold text-gray-700 truncate">{user?.username || user?.nip || user?.nis || 'User'}</p>
              </div>
              <button 
                onClick={() => handleAction('/profil-user')}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-xs font-semibold"
                role="menuitem"
              >
                <User size={14} className="text-gray-500" /> Profil Saya
              </button>
              <button 
                onClick={() => handleAction('/pengaturan')}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-xs font-semibold"
                role="menuitem"
              >
                <Settings size={14} className="text-gray-500" /> Pengaturan
              </button>
              <div className="my-1 border-t border-gray-100"></div>
              <button 
                onClick={handleLogoutClick}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-3 text-xs font-semibold"
                role="menuitem"
              >
                <LogOut size={14} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

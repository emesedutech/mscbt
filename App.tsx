import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage.tsx';
import AdminPortal from './components/AdminPortal.tsx';
import StudentPortal from './components/StudentPortal.tsx';
import SuperAdminPortal from './components/SuperAdminPortal.tsx';
import SuperAdminLoginPage from './components/SuperAdminLoginPage.tsx';
import ResellerPortal from './components/ResellerPortal.tsx';
import { ToastProvider } from './components/ToastProvider.tsx';
import { supabase } from './lib/supabase.ts';
import { School } from './types.ts';
import ConfirmModal from './components/ConfirmModal.tsx';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [route, setRoute] = useState(window.location.pathname);
  const [logoutConfirm, setLogoutConfirm] = useState<{ isOpen: boolean, path: string }>({ isOpen: false, path: '/' });

  useEffect(() => {
    const onLocationChange = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setRoute(path);
    }
  }

  const handleLoginSuccess = (user: any, role: any) => {
    setCurrentUser(user);
    setUserRole(role);
    if (role === 'super_admin') {
        navigateTo('/sa');
    } else if (role === 'reseller') {
        navigateTo('/reseller');
    } else {
        // Untuk admin dan siswa, arahkan ke dashboard root mereka
        navigateTo('/');
    }
  };

  const doLogout = (path: string) => {
    localStorage.clear(); // Session Cleanup
    setCurrentUser(null);
    setUserRole(null);
    navigateTo(path);
  };
  
  const handleLogout = (path: string = '/', confirm: boolean = true) => {
    if (confirm) {
      setLogoutConfirm({ isOpen: true, path });
    } else {
      doLogout(path);
    }
  };

  const renderCurrentRoute = () => {
    if (route.startsWith('/sa') || route.startsWith('/super')) {
      if (currentUser && (userRole === 'super_admin' || userRole === 'reseller')) {
        if (userRole === 'super_admin') {
          return <SuperAdminPortal user={currentUser} onLogout={handleLogout} onDataChange={() => {}} onNavigate={navigateTo} />;
        }
        if (userRole === 'reseller') { 
          navigateTo('/reseller');
          return <ResellerPortal user={currentUser} onLogout={() => handleLogout('/sa')} onNavigate={navigateTo} />;
        }
      }
      return <SuperAdminLoginPage onLoginSuccess={handleLoginSuccess} />;
    }
    
    if (route.startsWith('/reseller')) {
        if (currentUser && userRole === 'reseller') {
            return <ResellerPortal user={currentUser} onLogout={() => handleLogout('/sa')} onNavigate={navigateTo} />;
        }
        navigateTo('/sa');
        return <SuperAdminLoginPage onLoginSuccess={handleLoginSuccess} />;
    }
  
    if (currentUser) {
      if (userRole === 'siswa') {
        return <StudentPortal user={currentUser} onLogout={handleLogout} onNavigate={navigateTo} />;
      }
      // Pass onNavigate to AdminPortal
      return <AdminPortal user={currentUser} role={userRole as any} onLogout={handleLogout} onNavigate={navigateTo} />;
    }
    
    const npsnFromUrl = window.location.pathname.replace('/', '');
    return <LoginPage onLoginSuccess={handleLoginSuccess} npsnFromUrl={npsnFromUrl} />;
  }

  return (
    <>
      {renderCurrentRoute()}
      {logoutConfirm.isOpen && (
        <ConfirmModal
          title="Konfirmasi Keluar"
          message="Anda yakin ingin keluar dari sesi aplikasi ini?"
          type="warning"
          confirmText="Ya, Keluar"
          onConfirm={() => {
            doLogout(logoutConfirm.path);
            setLogoutConfirm({ isOpen: false, path: '/' });
          }}
          onCancel={() => setLogoutConfirm({ isOpen: false, path: '/' })}
        />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
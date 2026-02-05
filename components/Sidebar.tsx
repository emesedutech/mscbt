
import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types.ts';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  activePath: string;
  menuItems: MenuItem[];
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  isCollapsed, 
  activePath, 
  menuItems,
  onNavigate, 
  onLogout,
  onCloseMobile, 
  onToggleCollapse 
}) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    const parentOfActive = menuItems.find(item => 
      item.children?.some(child => child.path === activePath)
    );
    if (parentOfActive) {
      setOpenMenus([parentOfActive.id]);
    } else {
      setOpenMenus([]);
    }
  }, [activePath, menuItems]);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => (prev.includes(id) ? [] : [id]));
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed left-0 top-0 bottom-0 flex flex-col
        transition-all duration-300 ease-in-out border-r border-[#064E3B] bg-[#022C22]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 !overflow-visible
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        z-40
      `}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="hidden md:flex absolute top-[117px] -translate-y-1/2 -right-3 w-6 h-6 bg-white border border-gray-300 rounded-full items-center justify-center text-[#065F46] shadow-sm z-[100] transition-all hover:bg-emerald-50 hover:border-emerald-500 active:scale-90"
          title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          aria-label={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
        </button>

        <div className="h-20 shrink-0"></div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin overflow-x-hidden">
          <nav className="space-y-1 px-3">
            {menuItems.map((item: MenuItem) => {
              const hasChildren = !!item.children;
              const isActive = hasChildren ? item.children.some(child => child.path === activePath) : activePath === item.path;
              const isParentActive = hasChildren && openMenus.includes(item.id);

              if (!hasChildren) {
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.path); onCloseMobile(); }}
                    className={`
                      w-full flex items-center h-10 transition-colors
                      ${isActive ? 'bg-[#065F46] text-white' : 'text-emerald-300/70 hover:bg-[#064E3B]/60 hover:text-white'}
                      rounded
                      ${isCollapsed ? 'px-0 justify-center' : 'px-3'}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={`transition-colors duration-200 ${isCollapsed ? 'm-0' : 'mr-3'}`}>
                      {React.cloneElement(item.icon as React.ReactElement<any>, { size: 18 })}
                    </span>
                    <span className={`text-xs font-semibold whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`
                      w-full flex items-center h-10 transition-colors
                      ${isActive || isParentActive ? 'bg-[#064E3B]/80 text-white' : 'text-emerald-300/70 hover:bg-[#064E3B]/60 hover:text-white'}
                      rounded
                      ${isCollapsed ? 'px-0 justify-center' : 'px-3'}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={`transition-colors duration-200 ${isCollapsed ? 'm-0' : 'mr-3'}`}>
                      {React.cloneElement(item.icon as React.ReactElement<any>, { size: 18 })}
                    </span>
                    <span className={`text-xs font-semibold whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                      {item.label}
                    </span>
                    {!isCollapsed && <ChevronDown size={16} className={`ml-auto shrink-0 transition-transform duration-200 ${isParentActive ? 'rotate-180' : ''}`} />}
                  </button>
                  {isParentActive && !isCollapsed && (
                    <div className="pl-8 pt-1 pb-1 space-y-1 mt-1">
                      {item.children?.map(child => {
                        const isChildActive = activePath === child.path;
                        return (
                          <button
                            key={child.id}
                            onClick={() => { onNavigate(child.path); onCloseMobile(); }}
                            className={`w-full flex items-center py-1.5 px-3 rounded transition-colors text-xs font-medium ${isChildActive ? 'text-white bg-[#065F46]' : 'text-emerald-300/60 hover:text-white'}`}
                          >
                            <span className="w-1 h-1 bg-emerald-500 rounded-full mr-3"></span>
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="bg-[#064E3B]/30 border-t border-[#064E3B] overflow-hidden">
          <div className={`px-4 py-3 transition-all ${isCollapsed ? 'px-0 flex justify-center' : ''}`}>
            <div className={`flex items-center gap-2 p-2 bg-black/10 rounded border border-white/10 transition-all ${isCollapsed ? 'border-none bg-transparent' : ''}`}>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]"></div>
              {!isCollapsed && <span className="text-[10px] font-semibold text-emerald-200">TERHUBUNG</span>}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

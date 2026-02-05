
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '../types.ts';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigateHome: () => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigateHome }) => {
  return (
    <nav className="bg-white border-b border-gray-300 px-6 py-3 flex items-center text-xs uppercase tracking-wider font-semibold">
      <button 
        onClick={onNavigateHome}
        className="text-gray-500 hover:text-emerald-700 transition-colors flex items-center gap-1.5"
      >
        <Home size={14} />
        <span className="hidden sm:inline">HOME</span>
      </button>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="mx-2 text-gray-300" />
          <span className={`
            ${index === items.length - 1 ? 'text-gray-800' : 'text-emerald-700 cursor-default'}
          `}>
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;

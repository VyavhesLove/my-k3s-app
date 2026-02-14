import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  pageSize, 
  onPageChange, 
  onPageSizeChange, 
  isDarkMode 
}) => {
  return (
    <div 
      className={`px-6 py-4 flex items-center justify-between border-t border-slate-700/50`}
      style={{
        backgroundColor: 'var(--table-header-bg)',
        borderTopColor: 'var(--table-border)'
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--table-text)', opacity: 0.6 }}>
          Кол-во на странице:
        </span>
        <select 
          value={pageSize} 
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="input-theme bg-transparent border rounded px-2 py-1 text-xs focus:outline-none"
        >
          {[10, 20, 50].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
          className="p-2 hover:bg-blue-500/20 rounded-lg disabled:opacity-30"
          disabled={currentPage === 1}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
          Страница {currentPage} из {totalPages || 1}
        </span>
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
          className="p-2 hover:bg-blue-500/20 rounded-lg disabled:opacity-30"
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;


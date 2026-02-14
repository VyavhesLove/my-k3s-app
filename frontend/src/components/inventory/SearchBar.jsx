import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ searchQuery, onSearch, isDarkMode }) => {
  return (
    <div className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Поиск по названию..."
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        className={`pl-10 pr-4 py-2 rounded-lg text-sm w-64 outline-none transition-all ${
          isDarkMode 
            ? 'bg-slate-800 border border-slate-700 focus:border-blue-500' 
            : 'bg-white border border-gray-200 focus:border-blue-400'
        } border`}
      />
      {searchQuery && (
        <button
          onClick={() => onSearch('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;


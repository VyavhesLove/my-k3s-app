import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import { statusMap } from '@/constants/statusConfig';

// Компонент для фильтрации по статусу (select)
const StatusFilter = ({ isDarkMode, filterValue, onFilterChange }) => {
  const hasValue = filterValue.length > 0;

  const handleChange = (e) => {
    const englishValue = e.target.value;
    onFilterChange(englishValue);
  };

  return (
    <div className="relative">
      {hasValue && (
        <button
          onClick={() => onFilterChange('')}
          className="absolute left-2 top-1.5 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X size={14} />
        </button>
      )}
      <select
        value={filterValue}
        onChange={handleChange}
        className="input-theme py-2 pl-7 pr-8 text-xs w-full rounded outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Все статусы</option>
        {Object.entries(statusMap).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className={`absolute right-2 top-2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
    </div>
  );
};

export default StatusFilter;


import React from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import StatusFilter from './StatusFilter';

// Выносим TableHeader как отдельный компонент
const TableHeader = ({
  label,
  sortKey,
  isDarkMode,
  sortConfig,
  handleSortClick,
  filters,
  handleFilterChange
}) => {
  const filterValue = filters[sortKey] || '';
  const hasValue = filterValue.length > 0;
  const sortDirection = sortConfig.find(c => c.key === sortKey)?.direction;
  const isPrimary = sortConfig.length > 0 && sortConfig[0].key === sortKey;
  
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b"
      style={{ borderColor: 'var(--table-border)', color: 'var(--table-text)' }}>
      <div className="flex flex-col gap-2">
        <div
          className={`flex items-center gap-1 cursor-pointer hover:text-blue-400 ${sortDirection ? 'text-blue-400' : ''}`}
          onClick={(e) => handleSortClick(sortKey, e)}
          title={isPrimary ? 'Первичная сортировка (Shift+клик для вторичной)' : 'Вторичная сортировка'}
        >
          {label}
          {sortDirection ? (
            sortDirection === 'asc' ? (
              <ArrowUp size={14} />
            ) : (
              <ArrowDown size={14} />
            )
          ) : (
            <ArrowUpDown size={12} className="opacity-50" />
          )}
          {isPrimary && sortConfig.length > 1 && (
            <span className="text-[10px] bg-blue-600 px-1 rounded">{sortConfig.length}</span>
          )}
        </div>

        {/* Для колонки статуса используем select */}
        {sortKey === 'status' ? (
          <StatusFilter 
            isDarkMode={isDarkMode} 
            filterValue={filterValue} 
            onFilterChange={(value) => handleFilterChange(sortKey, value)} 
          />
        ) : (
          /* Для остальных колонок используем input */
          <div className="relative">
            {hasValue ? (
              <button
                onClick={() => handleFilterChange(sortKey, '')}
                className="absolute left-2 top-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            ) : (
              <Search size={12} className="absolute left-2 top-2.5 text-gray-400" />
            )}
            <input
              type="text"
              placeholder="Поиск..."
              value={filterValue}
              onChange={(e) => handleFilterChange(sortKey, e.target.value)}
              className="input-theme pl-7 pr-2 py-2 text-xs w-full rounded outline-none transition-colors focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </th>
  );
};

export default TableHeader;


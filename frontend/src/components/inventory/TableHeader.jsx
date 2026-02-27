import React, { useState, useEffect, useRef } from 'react';
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
  handleFilterChange,
  customFilter
}) => {
  // Локальное состояние для input-а - предотвращает потерю фокуса
  const [localValue, setLocalValue] = useState('');
  const debounceRef = useRef(null);
  
  // Синхронизируем локальное значение с глобальным фильтром
  useEffect(() => {
    const globalValue = filters[sortKey] || '';
    setLocalValue(globalValue);
  }, [filters, sortKey]);

  // Для status - массив, для остальных - строка
  const filterValue = sortKey === 'status' 
    ? (filters[sortKey] || []) 
    : (filters[sortKey] || '');
  const hasValue = sortKey === 'status' 
    ? (Array.isArray(filterValue) && filterValue.length > 0) 
    : (typeof filterValue === 'string' && filterValue.length > 0);
  const sortDirection = sortConfig.find(c => c.key === sortKey)?.direction;
  const isPrimary = sortConfig.length > 0 && sortConfig[0].key === sortKey;
  
  // Обработчик изменения с debounce
  const handleInputChange = (value) => {
    setLocalValue(value);
    
    // Очищаем предыдущий таймер
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce 300ms - отправляем только после паузы
    debounceRef.current = setTimeout(() => {
      handleFilterChange(sortKey, value);
    }, 300);
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b"
      style={{ 
        borderColor: 'var(--table-border)', 
        color: 'var(--table-text)',
        verticalAlign: 'middle',
        position: 'relative'
      }}>
      <div className="flex flex-col gap-1">
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

        {/* Если передан кастомный фильтр - используем его */}
        {customFilter ? (
          customFilter
        ) : sortKey === 'status' ? (
          /* Для колонки статуса используем StatusFilter */
          <StatusFilter 
            isDarkMode={isDarkMode} 
            filterValue={filterValue} 
            onFilterChange={(value) => handleFilterChange(sortKey, value)} 
          />
        ) : (
          /* Для остальных колонок используем input */
          <div className="relative">
            {localValue ? (
              <button
                onClick={() => handleInputChange('')}
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
              value={localValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="input-theme pl-7 pr-2 py-2 text-xs w-full rounded outline-none transition-colors focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </th>
  );
};

export default TableHeader;


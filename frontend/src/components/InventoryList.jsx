import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { statusMap, getStatusStyles } from '../constants/statusConfig';
import { useItemStore } from '../store/useItemStore';

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

function InventoryList({ isDarkMode }) {
  const location = useLocation();
  const { setSelectedItem, selectedItem } = useItemStore();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({});
  // Массив критериев сортировки: [{ key, direction }]
  const [sortConfig, setSortConfig] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchItems = (searchQuery = '') => {
    const fetchItemsAsync = async () => {
      // Проверка наличия токена перед запросом
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      try {
        const params = new URLSearchParams();
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        const queryString = params.toString();
        
        const response = await api.get(`/items${queryString ? '?' + queryString : ''}`);
        setItems(response.data.items || []);
        // Сбрасываем выбор при обновлении
        setSelectedItem(null);
        setSortConfig([]);
        setCurrentPage(1);
      } catch (err) {
        console.error('Ошибка загрузки:', err);
      }
    };
    fetchItemsAsync();
  };

  // Функция полного сброса фильтров
  const resetAllFilters = () => {
    setFilters({});
    fetchItems('');
  };

  // Загружаем данные при монтировании и при каждом возврате на страницу
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchItems();
    }
  }, [location.pathname]);

  // Обработка навигации - сброс фильтров при переходе на главную
  useEffect(() => {
    if (location.pathname === '/') {
      if (location.state?.resetFilters || !location.state) {
        resetAllFilters();
      }
    }
  }, [location.pathname, location.state]);

  const handleFilterChange = (key, value) => {
    // Для статуса храним английский ключ без lowerCase
    const filterValue = key === 'status' ? value : (value ? value.toLowerCase() : '');
    
    setFilters(prev => ({
      ...prev,
      [key]: filterValue
    }));
    setCurrentPage(1);

    // Для фильтра по статусу вызываем API с выбранным значением
    if (key === 'status') {
      fetchItems(value);
    }
  };

  // Получаем параметр filter из URL
  const { search } = location;
  const queryParams = new URLSearchParams(search);
  const filterParam = queryParams.get('filter'); // "at_work,issued" или "in_repair"

  const sortedAndFilteredItems = useMemo(() => {
    let result = items.filter(item => {
      // Фильтрация по URL параметру filter
      if (filterParam) {
        const allowedStatuses = filterParam.split(',');
        if (!allowedStatuses.includes(item.status)) {
          return false;
        }
      }
      
      // Существующая фильтрация по полям
      return Object.keys(filters).every(key => 
        String(item[key] || '').toLowerCase().includes(filters[key])
      );
    });
    
    // Многоуровневая сортировка
    if (sortConfig.length > 0) {
      result.sort((a, b) => {
        for (const { key, direction } of sortConfig) {
          if (a[key] === b[key]) continue;
          const comparison = a[key] < b[key] ? -1 : 1;
          return direction === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }
    return result;
  }, [items, filters, sortConfig, filterParam]);

  // Функция для обработки клика по заголовку с учетом Shift для вторичной сортировки
  const handleSortClick = (key, e) => {
    if (e.shiftKey && sortConfig.length > 0) {
      // Добавляем вторичную сортировку
      const existingIndex = sortConfig.findIndex(c => c.key === key);
      if (existingIndex >= 0) {
        // Удаляем существующий критерий
        const newConfig = sortConfig.filter((_, i) => i !== existingIndex);
        setSortConfig(newConfig);
      } else {
        setSortConfig([...sortConfig, { key, direction: 'asc' }]);
      }
    } else {
      // Первичная сортировка (сбрасываем остальные)
      if (sortConfig.length > 0 && sortConfig[0].key === key) {
        // Инвертируем направление
        setSortConfig([{ key, direction: sortConfig[0].direction === 'asc' ? 'desc' : 'asc' }]);
      } else {
        setSortConfig([{ key, direction: 'asc' }]);
      }
    }
  };

  const paginatedItems = sortedAndFilteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(sortedAndFilteredItems.length / pageSize);

  // Получаем направление сортировки для конкретного ключа
  const getSortDirection = (key) => {
    const config = sortConfig.find(c => c.key === key);
    return config ? config.direction : null;
  };

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Список ТМЦ</h1>
            <button 
              onClick={resetAllFilters}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Обновить
            </button>
          </div>

          <div className="rounded-xl shadow-2xl overflow-hidden border"
            style={{
              backgroundColor: 'var(--table-bg)',
              borderColor: 'var(--table-border)'
            }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                    <th className="px-4 py-3 text-left text-xs font-bold border-b w-12"
                      style={{ borderColor: 'var(--table-border)' }}>№</th>
                    <TableHeader
                      label="Наименование"
                      sortKey="name"
                      isDarkMode={isDarkMode}
                      sortConfig={sortConfig}
                      handleSortClick={handleSortClick}
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                    />
                    <TableHeader
                      label="Серийный номер"
                      sortKey="serial"
                      isDarkMode={isDarkMode}
                      sortConfig={sortConfig}
                      handleSortClick={handleSortClick}
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                    />
                    <TableHeader
                      label="Бренд"
                      sortKey="brand"
                      isDarkMode={isDarkMode}
                      sortConfig={sortConfig}
                      handleSortClick={handleSortClick}
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                    />
                    <TableHeader
                      label="Статус"
                      sortKey="status"
                      isDarkMode={isDarkMode}
                      sortConfig={sortConfig}
                      handleSortClick={handleSortClick}
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                    />
                    <TableHeader
                      label="Ответственный"
                      sortKey="responsible"
                      isDarkMode={isDarkMode}
                      sortConfig={sortConfig}
                      handleSortClick={handleSortClick}
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                    />
                    <TableHeader
                      label="Локация"
                      sortKey="location"
                      isDarkMode={isDarkMode}
                      sortConfig={sortConfig}
                      handleSortClick={handleSortClick}
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                    />
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--table-text)', borderColor: 'var(--table-border)' }}>
                  {paginatedItems.map((item, index) => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)}
                      className={`cursor-pointer transition-colors ${
                        selectedItem?.id === item.id 
                          ? 'bg-blue-600/30 ring-1 ring-blue-500' 
                          : 'hover:bg-blue-500/5'
                      }`}
                      style={{ borderColor: 'var(--table-border)' }}
                    >
                      <td className="px-4 py-4">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-4 py-4 font-medium">{item.name}</td>
                      <td className="px-4 py-4 opacity-70">{item.serial}</td>
                      <td className="px-4 py-4">{item.brand}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${getStatusStyles(item.status, isDarkMode)}`}>
                          {statusMap[item.status] || item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 italic">{item.responsible}</td>
                      <td className="px-4 py-4">{item.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            <div className={`px-6 py-4 flex items-center justify-between border-t border-slate-700/50`}
              style={{
                backgroundColor: 'var(--table-header-bg)',
                borderTopColor: 'var(--table-border)'
              }}>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--table-text)', opacity: 0.6 }}>Кол-во на странице:</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="input-theme bg-transparent border rounded px-2 py-1 text-xs focus:outline-none"
                >
                  {[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 hover:bg-blue-500/20 rounded-lg disabled:opacity-30" disabled={currentPage === 1}>
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>Страница {currentPage} из {totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 hover:bg-blue-500/20 rounded-lg disabled:opacity-30" disabled={currentPage === totalPages}>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryList;


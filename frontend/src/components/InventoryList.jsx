import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import api from '@/api/axios';
import { useItemStore } from '@/store/useItemStore';

// Компоненты
import SearchBar from './inventory/SearchBar';
import Pagination from './inventory/Pagination';
import TableSkeleton from './inventory/TableSkeleton';
import EmptyState from './inventory/EmptyState';
import TableRow from './inventory/TableRow';
import TableHeader from './inventory/TableHeader';

function InventoryList({ isDarkMode }) {
  const location = useLocation();
  const { setSelectedItem, selectedItem, items, refreshItems, itemsLoading, lockedItems } = useItemStore();
  
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Загружаем данные при монтировании и при изменении URL
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshItems();
      setSelectedItem(null);
      setCurrentPage(1);
      setFilters({});
      setSortConfig([]);
      setSearchQuery('');
    }
  }, [location.pathname]);

  // Функция полного сброса фильтров
  const resetAllFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
    setSortConfig([]);
    refreshItems();
    setSelectedItem(null);
  }, [refreshItems, setSelectedItem]);

  // Функция поиска
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      const searchItems = async () => {
        try {
          const params = new URLSearchParams();
          params.append('search', query);
          const response = await api.get(`/items?${params.toString()}`);
          useItemStore.setState({ items: response.data.items || [] });
          setSelectedItem(null);
          setCurrentPage(1);
          setFilters({});
          setSortConfig([]);
        } catch (err) {
          console.error('Ошибка поиска:', err);
        }
      };
      searchItems();
    } else {
      refreshItems();
      setSelectedItem(null);
      setCurrentPage(1);
    }
  }, [refreshItems, setSelectedItem]);

  const handleFilterChange = (key, value) => {
    const filterValue = key === 'status' ? value : (value ? value.toLowerCase() : '');
    setFilters(prev => ({ ...prev, [key]: filterValue }));
    setCurrentPage(1);
  };

  // Получаем параметр filter из URL
  const { search } = location;
  const queryParams = new URLSearchParams(search);
  const filterParam = queryParams.get('filter');

  const sortedAndFilteredItems = useMemo(() => {
    let result = items.filter(item => {
      if (filterParam) {
        const allowedStatuses = filterParam.split(',');
        if (!allowedStatuses.includes(item.status)) {
          return false;
        }
      }
      return Object.keys(filters).every(key => 
        String(item[key] || '').toLowerCase().includes(filters[key])
      );
    });
    
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

  const handleSortClick = (key, e) => {
    if (e.shiftKey && sortConfig.length > 0) {
      const existingIndex = sortConfig.findIndex(c => c.key === key);
      if (existingIndex >= 0) {
        const newConfig = sortConfig.filter((_, i) => i !== existingIndex);
        setSortConfig(newConfig);
      } else {
        setSortConfig([...sortConfig, { key, direction: 'asc' }]);
      }
    } else {
      if (sortConfig.length > 0 && sortConfig[0].key === key) {
        setSortConfig([{ key, direction: sortConfig[0].direction === 'asc' ? 'desc' : 'asc' }]);
      } else {
        setSortConfig([{ key, direction: 'asc' }]);
      }
    }
  };

  const paginatedItems = sortedAndFilteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(sortedAndFilteredItems.length / pageSize);

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Заголовок с поиском и кнопками */}
          <div className="flex justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-primary">Список ТМЦ</h1>
            
            <div className="flex items-center gap-3">
              <SearchBar 
                searchQuery={searchQuery} 
                onSearch={handleSearch} 
                isDarkMode={isDarkMode} 
              />
              <button 
                onClick={resetAllFilters}
                disabled={itemsLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg flex items-center gap-2 ${
                  isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${itemsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw size={16} className={itemsLoading ? 'animate-spin' : ''} />
                Обновить
              </button>
            </div>
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
                    <TableHeader label="Наименование" sortKey="name" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                    <TableHeader label="Серийный номер" sortKey="serial" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                    <TableHeader label="Бренд" sortKey="brand" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                    <TableHeader label="Статус" sortKey="status" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                    <TableHeader label="Ответственный" sortKey="responsible" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                    <TableHeader label="Локация" sortKey="location" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--table-text)', borderColor: 'var(--table-border)' }}>
                  {itemsLoading ? (
                    <TableSkeleton />
                  ) : paginatedItems.length === 0 ? (
                    <EmptyState searchQuery={searchQuery} onClearSearch={() => handleSearch('')} />
                  ) : (
                    paginatedItems.map((item, index) => {
                      const isLocked = lockedItems[item.id];
                      return (
                        <TableRow
                          key={item.id}
                          item={item}
                          index={index}
                          isSelected={selectedItem?.id === item.id}
                          isLocked={isLocked}
                          lockedItems={lockedItems}
                          onSelect={setSelectedItem}
                          isDarkMode={isDarkMode}
                          currentPage={currentPage}
                          pageSize={pageSize}
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {sortedAndFilteredItems.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryList;


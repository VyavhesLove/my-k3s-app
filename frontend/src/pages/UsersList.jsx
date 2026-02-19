import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

// Компоненты
import SearchBar from '@/components/inventory/SearchBar';
import Pagination from '@/components/inventory/Pagination';
import TableSkeleton from '@/components/inventory/TableSkeleton';
import TableHeader from '@/components/inventory/TableHeader';
import RoleFilter from '@/components/users/RoleFilter';
import { getRoleText } from '@/utils/role';

// Store
import { useUserStore } from '@/store/useUserStore';

function UsersList({ isDarkMode }) {
  // Используем Zustand store
  const {
    users,
    usersLoading,
    totalCount,
    currentPage,
    pageSize,
    filters,
    searchQuery,
    refreshUsers,
    setCurrentPage,
    setPageSize,
    setFilters,
    setSearchQuery,
  } = useUserStore();

  const [sortConfig, setSortConfig] = useState([]);

  // Загружаем при монтировании (только один раз)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshUsers({ page: 1, page_size: 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Функция полного сброса
  const resetAllFilters = useCallback(() => {
    setFilters({ role: [] });
    setSearchQuery('');
    setCurrentPage(1);
    refreshUsers({ page: 1, page_size: pageSize });
  }, [pageSize, refreshUsers, setFilters, setSearchQuery, setCurrentPage]);

  // Функция поиска
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    
    // Делаем серверный поиск
    refreshUsers({
      page: 1,
      page_size: pageSize,
      search: query.trim(),
      role: filters.role
    });
  }, [pageSize, refreshUsers, setCurrentPage, setSearchQuery, filters.role]);

  const handleFilterChange = useCallback((key, value) => {
    if (key === 'role') {
      setFilters(prev => ({ ...prev, [key]: value }));
    } else {
      const filterValue = value ? value.toLowerCase() : '';
      setFilters(prev => ({ ...prev, [key]: filterValue }));
    }
    setCurrentPage(1);
    // Обновляем данные с новым фильтром
    refreshUsers({ 
      page: 1, 
      page_size: pageSize,
      search: searchQuery.trim(),
      role: key === 'role' ? value : filters.role
    });
  }, [pageSize, filters.role, refreshUsers, setFilters, setCurrentPage, searchQuery]);

  // Клиентская фильтрация и сортировка
  const sortedAndFilteredUsers = useMemo(() => {
    const usersArray = users || [];
    const rolesArray = filters?.role || [];
    let result = [...usersArray];
    
    // Фильтрация по ролям (если сервер не отфильтровал)
    if (rolesArray.length > 0) {
      result = result.filter(user => rolesArray.includes(user.role));
    }

    // Сортировка
    if (sortConfig?.length > 0) {
      result.sort((a, b) => {
        for (const { key, direction } of sortConfig) {
          const aVal = a[key] || '';
          const bVal = b[key] || '';
          if (aVal === bVal) continue;
          const comparison = aVal < bVal ? -1 : 1;
          return direction === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }
    return result;
  }, [users, filters, sortConfig]);

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

  const getRoleStyles = (role, isDarkMode) => {
    const styles = {
      admin: isDarkMode
        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
        : 'bg-purple-100 text-purple-700 border border-purple-200',
      storekeeper: isDarkMode
        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        : 'bg-blue-100 text-blue-700 border border-blue-200',
      foreman: isDarkMode
        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
        : 'bg-green-100 text-green-700 border border-green-200',
    };
    return styles[role] || (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500');
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-primary">Пользователи</h1>
            
            <div className="flex items-center gap-3">
              <SearchBar 
                searchQuery={searchQuery} 
                onSearch={handleSearch} 
                isDarkMode={isDarkMode}
                disabled={usersLoading}
              />
              <button 
                onClick={resetAllFilters}
                disabled={usersLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg flex items-center gap-2 ${
                  isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${usersLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw size={16} className={usersLoading ? 'animate-spin' : ''} />
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
              <table className="w-full text-sm" style={{ minHeight: '520px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                    <th className="px-4 py-3 text-left text-xs font-bold border-b w-12"
                      style={{ borderColor: 'var(--table-border)' }}>№</th>
                    <TableHeader label="Логин" sortKey="username" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                    <TableHeader label="Email" sortKey="email" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                    <TableHeader label="Имя" sortKey="first_name" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                    <TableHeader label="Фамилия" sortKey="last_name" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} />
                    <TableHeader label="Роль" sortKey="role" isDarkMode={isDarkMode} sortConfig={sortConfig} handleSortClick={handleSortClick} filters={filters} handleFilterChange={handleFilterChange} customFilter={<RoleFilter isDarkMode={isDarkMode} filterValue={filters.role} onFilterChange={(value) => handleFilterChange('role', value)} />} />
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--table-text)', borderColor: 'var(--table-border)' }}>
                  {usersLoading ? (
                    <TableSkeleton />
                  ) : sortedAndFilteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-gray-500">
                            {searchQuery ? 'Ничего не найдено' : 'Нет пользователей'}
                          </span>
                          {searchQuery && (
                            <button 
                              onClick={() => handleSearch('')}
                              className="text-blue-500 hover:underline text-sm"
                            >
                              Очистить поиск
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {sortedAndFilteredUsers.map((user, index) => (
                        <tr 
                          key={user.id}
                          className="border-b transition-colors hover:bg-blue-500/5"
                          style={{ borderColor: 'var(--table-border)' }}
                        >
                          <td className="px-4 py-4">{(currentPage - 1) * pageSize + index + 1}</td>
                          <td className="px-4 py-4 font-medium">{user.username}</td>
                          <td className="px-4 py-4 opacity-70">{user.email}</td>
                          <td className="px-4 py-4">{user.first_name || '-'}</td>
                          <td className="px-4 py-4">{user.last_name || '-'}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${getRoleStyles(user.role, isDarkMode)}`}>
                              {getRoleText(user.role)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {Array.from({ length: Math.max(0, pageSize - sortedAndFilteredUsers.length) }).map((_, index) => (
                        <tr key={`spacer-${index}`} className="h-[52px]">
                          <td colSpan={6} />
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {totalCount > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  refreshUsers({ page, page_size: pageSize, search: searchQuery, role: filters.role });
                }}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  refreshUsers({ page: 1, page_size: size, search: searchQuery, role: filters.role });
                }}
                isDarkMode={isDarkMode}
                totalCount={totalCount}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsersList;


import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserStore } from '@/store/useUserStore';

export const useUsers = (isDarkMode) => {
  const {
    users,
    usersLoading,
    totalCount,
    currentPage,
    pageSize,
    filters,
    searchQuery,
    searchField,
    refreshUsers,
    setCurrentPage,
    setPageSize,
    setFilters,
    setSearchQuery,
    setSearchField,
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
    setSearchField('');
    setCurrentPage(1);
    refreshUsers({ page: 1, page_size: pageSize });
  }, [pageSize, refreshUsers, setFilters, setSearchQuery, setSearchField, setCurrentPage]);

  // Функция поиска
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setSearchField('');
    setCurrentPage(1);
    refreshUsers({
      page: 1,
      page_size: pageSize,
      search: query.trim(),
      search_field: '',
      role: filters.role
    });
  }, [pageSize, refreshUsers, setCurrentPage, setSearchQuery, setSearchField, filters.role]);

  // Изменение фильтра
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = key === 'role' ? value : (value ? value.toLowerCase() : '');
    setFilters(prev => ({ ...prev, [key]: newFilters }));
    
    const columnSearchFields = ['username', 'email', 'first_name', 'last_name'];
    if (columnSearchFields.includes(key)) {
      setSearchField(key);
    } else if (key !== 'role') {
      setSearchField('');
    }
    
    setCurrentPage(1);
    
    const currentFilters = useUserStore.getState().filters;
    const currentRole = key === 'role' ? value : currentFilters.role;
    const currentSearchField = useUserStore.getState().searchField;
    
    const columnSearch = columnSearchFields.includes(key) 
      ? newFilters 
      : (currentSearchField ? currentFilters[currentSearchField] : '');
    const globalSearch = useUserStore.getState().searchQuery;
    const searchValue = columnSearch || globalSearch;
    
    refreshUsers({
      page: 1, 
      page_size: pageSize,
      search: searchValue ? searchValue.trim() : '',
      search_field: currentSearchField,
      role: Array.isArray(currentRole) ? currentRole : []
    });
  }, [pageSize, refreshUsers, setFilters, setSearchField, setCurrentPage]);

  // Клик по заголовку для сортировки
  const handleSortClick = useCallback((key) => {
    setSortConfig(prev => {
      if (prev.length > 0 && prev[0].key === key) {
        return [{ key, direction: prev[0].direction === 'asc' ? 'desc' : 'asc' }];
      }
      return [{ key, direction: 'asc' }];
    });
  }, []);

  // Клиентская сортировка
  const sortedUsers = useMemo(() => {
    let result = [...(users || [])];
    
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
  }, [users, sortConfig]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Обработчик пагинации
  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
    refreshUsers({ 
      page, 
      page_size: pageSize, 
      search: searchQuery, 
      search_field: searchField, 
      role: filters.role 
    });
  }, [pageSize, refreshUsers, setCurrentPage, searchQuery, searchField, filters.role]);

  const onPageSizeChange = useCallback((size) => {
    setPageSize(size);
    refreshUsers({ 
      page: 1, 
      page_size: size, 
      search: searchQuery, 
      search_field: searchField, 
      role: filters.role 
    });
  }, [pageSize, refreshUsers, setPageSize, searchQuery, searchField, filters.role]);

  return {
    users: sortedUsers,
    usersLoading,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    filters,
    searchQuery,
    searchField,
    sortConfig,
    resetAllFilters,
    handleSearch,
    handleFilterChange,
    handleSortClick,
    onPageChange,
    onPageSizeChange,
  };
};


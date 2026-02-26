
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUserStore } from '@/store/useUserStore';
import api from '@/api/axios';

export const useUsers = (isDarkMode) => {
  const {
    users,
    usersLoading,
    totalCount,
    currentPage,
    pageSize,
    filters,
    searchField,
    setCurrentPage,
    setPageSize,
    setFilters,
    setSearchField,
  } = useUserStore();

  // Локальное состояние для поиска - как в InventoryList
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState([]);

  // Ref для debounce
  const debounceRef = useRef(null);

  // Функция обновления списка пользователей
  const refreshUsers = useCallback(async (params = {}) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const state = useUserStore.getState();
      const search = params.search ?? state.searchQuery;
      const role = params.role ?? state.filters.role;
      const search_field = params.search_field ?? '';

      const urlParams = new URLSearchParams();
      if (params.page) urlParams.append('page', params.page);
      if (params.page_size) urlParams.append('page_size', params.page_size);
      
      if (search && search.trim().length > 0) {
        urlParams.append('search', search.trim());
      }
      
      if (search_field) {
        urlParams.append('search_field', search_field);
      }
      
      if (Array.isArray(role) && role.length > 0) {
        urlParams.append('role', role.join(','));
      }

      const response = await api.get(`/users/list/?${urlParams.toString()}`);
      
      let usersArray = [];
      let totalCount = 0;

      if (response.data?.data?.users && Array.isArray(response.data.data.users)) {
        usersArray = response.data.data.users;
        totalCount = response.data.data.total_count || 0;
      }
      else if (response.data?.users && Array.isArray(response.data.users)) {
        usersArray = response.data.users;
        totalCount = response.data.total_count || 0;
      }

      useUserStore.setState({
        users: usersArray,
        totalCount: totalCount,
      });
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
    }
  }, []);

  // Загружаем при монтировании (только один раз)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshUsers({ page: 1, page_size: 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Функция полного сброса
  const resetAllFilters = useCallback(() => {
    setFilters({ role: [] });
    setSearchQuery('');
    setSearchField('');
    setCurrentPage(1);
    refreshUsers({ page: 1, page_size: pageSize });
  }, [pageSize, refreshUsers, setFilters, setSearchQuery, setSearchField, setCurrentPage]);

  // Функция поиска - с debounce как в TableHeader
  const handleSearch = useCallback((query) => {
    // Сразу обновляем локальное состояние - фокус не теряется
    setSearchQuery(query);
    setSearchField('');
    setCurrentPage(1);
    
    // Debounce - отправляем запрос после паузы
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const state = useUserStore.getState();
      refreshUsers({
        page: 1,
        page_size: state.pageSize || pageSize,
        search: query.trim(),
        search_field: '',
        role: state.filters.role
      });
    }, 300);
  }, [pageSize, refreshUsers, setCurrentPage, setSearchQuery, setSearchField]);

  // Изменение фильтра - для текстовых полей используем debounce
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = key === 'role' ? value : (value ? value : '');
    setFilters(prev => ({ ...prev, [key]: newFilters }));
    
    const columnSearchFields = ['username', 'email', 'first_name', 'last_name'];
    if (columnSearchFields.includes(key)) {
      setSearchField(key);
    } else if (key !== 'role') {
      setSearchField('');
    }
    
    setCurrentPage(1);
    
    // Для текстовых полей (поиск по колонкам) - без debounce (он уже есть в TableHeader)
    if (columnSearchFields.includes(key)) {
      const state = useUserStore.getState();
      const currentFilters = state.filters;
      const currentRole = currentFilters.role;
      const currentSearchField = state.searchField;
      
      const columnSearch = currentSearchField ? currentFilters[currentSearchField] : '';
      const globalSearch = searchQuery;
      const searchValue = columnSearch || globalSearch;
      
      refreshUsers({
        page: 1, 
        page_size: state.pageSize || pageSize,
        search: searchValue ? searchValue.trim() : '',
        search_field: currentSearchField,
        role: Array.isArray(currentRole) ? currentRole : []
      });
    } else {
      // Для role и других нетекстовых фильтров - сразу
      const state = useUserStore.getState();
      const currentFilters = state.filters;
      const currentRole = key === 'role' ? value : currentFilters.role;
      const currentSearchField = state.searchField;
      
      const columnSearch = columnSearchFields.includes(key) 
        ? newFilters 
        : (currentSearchField ? currentFilters[currentSearchField] : '');
      const globalSearch = searchQuery;
      const searchValue = columnSearch || globalSearch;
      
      refreshUsers({
        page: 1, 
        page_size: state.pageSize || pageSize,
        search: searchValue ? searchValue.trim() : '',
        search_field: currentSearchField,
        role: Array.isArray(currentRole) ? currentRole : []
      });
    }
  }, [pageSize, refreshUsers, setFilters, setSearchField, setCurrentPage, searchQuery]);

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


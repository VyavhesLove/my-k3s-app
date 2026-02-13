// Умный хук для списаний с Debounce и AbortController
import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';

// Хук для загрузки доступных опций фильтрации
export const useWriteoffFilterOptions = () => {
  const [options, setOptions] = useState({ locations: [], names: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/writeoffs/filters/');
        setOptions(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Ошибка загрузки фильтров');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  return { options, loading, error };
};

// Основной хук для списка списаний
export const useWriteoffList = (filters, page = 1) => {
  const [state, setState] = useState({
    items: [],
    totalCount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const controller = new AbortController();
    
    // Debounce для текстового поиска (500ms задержка)
    const timeoutId = setTimeout(async () => {
      setState(prev => ({ ...prev, loading: true }));
      
      try {
        const params = {
          page: page,
          is_cancelled: filters.is_cancelled,
        };
        
        // Добавляем текстовый поиск
        if (filters.search) {
          params.search = filters.search;
        }
        
        // Массивы локаций и названий преобразуем в запятые
        if (filters.locations?.length > 0) {
          params.location = filters.locations.join(',');
        }
        if (filters.names?.length > 0) {
          params.name = filters.names.join(',');
        }
        
        if (filters.date) {
          params.date = filters.date;
        }

        const response = await api.get('/writeoffs/', {
          params,
          signal: controller.signal
        });

        setState({
          items: response.data.write_offs || response.data.results || [],
          totalCount: response.data.count || response.data.total || 0,
          loading: false,
          error: null
        });
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: err.response?.data?.error || err.message 
          }));
        }
      }
    }, filters.search ? 500 : 0);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [filters, page]);

  return state;
};

// Хук для управления фильтрами
export const useWriteoffFilters = () => {
  const [filters, setFilters] = useState({
    search: '',
    locations: [],
    names: [],
    date: '',
    is_cancelled: false
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const setSearch = useCallback((value) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, []);

  const toggleLocation = useCallback((locationId) => {
    setFilters(prev => {
      const locations = prev.locations.includes(locationId)
        ? prev.locations.filter(id => id !== locationId)
        : [...prev.locations, locationId];
      return { ...prev, locations };
    });
  }, []);

  const toggleName = useCallback((name) => {
    setFilters(prev => {
      const names = prev.names.includes(name)
        ? prev.names.filter(n => n !== name)
        : [...prev.names, name];
      return { ...prev, names };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      locations: [],
      names: [],
      date: '',
      is_cancelled: false
    });
  }, []);

  const toggleActiveCancelled = useCallback(() => {
    setFilters(prev => ({ ...prev, is_cancelled: !prev.is_cancelled }));
  }, []);

  return {
    filters,
    updateFilter,
    setSearch,
    toggleLocation,
    toggleName,
    resetFilters,
    toggleActiveCancelled,
    setFilters
  };
};

export default useWriteoffList;


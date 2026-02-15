import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { useWriteoffList, useWriteoffFilterOptions } from '@/hooks/useWriteoff';
import WriteoffFilters from '@/components/writeoff/WriteoffFilters';
import WriteoffTable from '@/components/writeoff/WriteoffTable';

const ScrapPage = ({ isDarkMode = false }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    locations: [],
    names: [],
    date: '',
    is_cancelled: false
  });

  useEffect(() => {
    console.log('[ScrapPage] Component mounted, filters:', filters);
  }, []);

  const { options, loading: optionsLoading } = useWriteoffFilterOptions();
  const { items, totalCount, loading, error } = useWriteoffList(filters, page);

  useEffect(() => {
    console.log('[ScrapPage] State updated - items:', items?.length, 'loading:', loading, 'error:', error);
  }, [items, loading, error]);

  // Toggle для фильтров
  const toggleFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
    setPage(1);
  };

  // Обновление текстовых полей
  const updateTextFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      search: '',
      locations: [],
      names: [],
      date: '',
      is_cancelled: false
    });
    setPage(1);
  };

  // Логика массового выбора
  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Выбрать/отменить все
  const toggleAllSelection = (selectAll) => {
    if (selectAll) {
      setSelectedIds(items.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Массовое действие: Возврат в работу
  const handleBulkRestore = async () => {
    if (window.confirm(`Вернуть в работу выбранные ТМЦ (${selectedIds.length} шт.)?`)) {
      try {
        await api.post('/writeoffs/bulk-restore/', { ids: selectedIds });
        window.location.reload();
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка при выполнении операции');
      }
    }
  };

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* HEADER С КНОПКАМИ И ФИЛЬТРАМИ */}
      <header className={`p-4 border-b flex flex-col gap-4 ${
        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'
      }`}>
        {/* Верхняя часть: Кнопки навигации и действия */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate('/')} 
            className={`flex items-center gap-2 font-bold transition-opacity ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft size={20} /> Назад
          </button>

          <div className="flex gap-3">
            <button 
              onClick={handleBulkRestore}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-lg font-bold transition-all"
            >
              <RotateCcw size={18} /> Вернуть в работу
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white">
              <FileText size={18} /> Отчет
            </button>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="text-blue-400 font-bold text-sm">Выбрано: {selectedIds.length}</div>
          )}
        </div>

        {/* Фильтры - горизонтально */}
        <WriteoffFilters
          filters={filters}
          options={options}
          optionsLoading={optionsLoading}
          onSearch={(value) => updateTextFilter('search', value)}
          onToggleLocation={(id) => toggleFilter('locations', id)}
          onToggleName={(name) => toggleFilter('names', name)}
          onDateChange={(value) => {
            updateTextFilter('date', value);
            setPage(1);
          }}
          onReset={resetFilters}
          isDarkMode={isDarkMode}
        />
      </header>

      {/* КОНТЕНТ - ТАБЛИЦА */}
      <main className="flex-1 overflow-auto p-6">
      <WriteoffTable
          data={items}
          loading={loading}
          error={error}
          isCancelledView={filters.is_cancelled}
          totalCount={totalCount}
          currentPage={page}
          onPageChange={setPage}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isDarkMode={isDarkMode}
        />
      </main>
    </div>
  );
};

export default ScrapPage;


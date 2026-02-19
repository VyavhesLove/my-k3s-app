import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { useWriteoffList, useWriteoffFilterOptions } from '@/hooks/useWriteoff';
import WriteoffFilters from '@/components/writeoff/WriteoffFilters';
import WriteoffTable from '@/components/writeoff/WriteoffTable';
import BulkRestoreModal from '@/components/writeoff/BulkRestoreModal';

export const ScrapPage = ({ isDarkMode = false }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreModalItems, setRestoreModalItems] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    locations: [],
    names: [],
    date: '',
    is_cancelled: false
  });

  const { options, loading: optionsLoading } = useWriteoffFilterOptions();
  const { items, totalCount, loading, error } = useWriteoffList(filters, page);

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

  // Массовое действие: Возврат в работу - открыть модальное окно
  const handleBulkRestore = () => {
    if (selectedIds.length > 0) {
      setRestoreModalItems(items.filter(item => selectedIds.includes(item.id)));
      setIsRestoreModalOpen(true);
    }
  };

  // Восстановление одного ТМЦ из строки таблицы
  const handleRestoreSingleClick = (item) => {
    setRestoreModalItems([item]);
    setIsRestoreModalOpen(true);
  };

  // Обработчик успешного восстановления
  const handleRestoreSuccess = () => {
    setSelectedIds([]);
    // Перезагрузить данные - просто сбросим фильтры чтобы триггернуть обновление
    setFilters(prev => ({ ...prev }));
  };

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* HEADER С КНОПКАМИ И ФИЛЬТРАМИ */}
      <header className={`p-4 border-b flex flex-col gap-4 ${
        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'
      }`}>
        {/* Верхняя часть: Кнопки навигации и действия */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className={`flex items-center gap-2 font-bold transition-opacity ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft size={20} /> Назад
            </button>
            
            {selectedIds.length > 0 && (
              <div className="text-blue-400 font-bold text-sm">Выбрано: {selectedIds.length}</div>
            )}
          </div>

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
          onRestoreClick={handleRestoreSingleClick}
        />
      </main>

      {/* Модальное окно восстановления ТМЦ */}
      <BulkRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        selectedItems={restoreModalItems}
        onSuccess={handleRestoreSuccess}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};


import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { useWriteoffList, useWriteoffFilters, useWriteoffFilterOptions } from '@/hooks/useWriteoff';

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

  const { options, loading: optionsLoading } = useWriteoffFilterOptions();
  const { items, totalCount, loading } = useWriteoffList(filters, page);

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
    <div className={`flex h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      <aside className={`w-72 border-r p-6 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'bg-white border-gray-200'}`}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-8 opacity-70 hover:opacity-100">
          <ArrowLeft size={20} /> <span className="font-bold">Назад</span>
        </button>

        <div className="space-y-8">
          {/* Поиск */}
          <div>
            <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Поиск</label>
            <input 
              className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-transparent'}`}
              placeholder="Название, инв. номер..."
              value={filters.search}
              onChange={(e) => updateTextFilter('search', e.target.value)}
            />
          </div>

          {/* Локации */}
          <div>
            <label className="text-[10px] font-bold uppercase opacity-50 block mb-3">Локации</label>
            <div className="space-y-2">
              {optionsLoading ? (
                <div className="text-sm opacity-50">Загрузка...</div>
              ) : options.locations?.map(loc => (
                <label key={loc.id} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={filters.locations.includes(loc.id)}
                    onChange={() => toggleFilter('locations', loc.id)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm group-hover:text-blue-400 transition-colors">{loc.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Наименования */}
          <div>
            <label className="text-[10px] font-bold uppercase opacity-50 block mb-3">Наименования</label>
            <div className="space-y-2">
              {optionsLoading ? (
                <div className="text-sm opacity-50">Загрузка...</div>
              ) : options.names?.map(name => (
                <label key={name} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={filters.names.includes(name)}
                    onChange={() => toggleFilter('names', name)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm group-hover:text-blue-400 transition-colors">{name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Дата */}
          <div>
            <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Дата списания</label>
            <input 
              type="date"
              className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-transparent'}`}
              value={filters.date}
              onChange={(e) => {
                updateTextFilter('date', e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </aside>

      {/* КОНТЕНТ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex gap-3">
            <button 
              onClick={handleBulkRestore}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-lg font-bold transition-all"
            >
              <RotateCcw size={18} /> Вернуть в работу
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold">
              <FileText size={18} /> Отчет
            </button>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="text-blue-400 font-bold text-sm">Выбрано: {selectedIds.length}</div>
          )}
        </header>

        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] uppercase opacity-40">
                <th className="px-4 pb-2">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === items.length && items.length > 0}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < items.length}
                    onChange={(e) => toggleAllSelection(e.target.checked)}
                  />
                </th>
                <th className="px-4 pb-2">ID</th>
                <th className="px-4 pb-2">ТМЦ</th>
                <th className="px-4 pb-2">Инв. номер</th>
                <th className="px-4 pb-2">Локация</th>
                <th className="px-4 pb-2">Дата списания</th>
                <th className="px-4 pb-2">Создатель</th>
                <th className="px-4 pb-2">Описание</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="animate-pulse">
                  <td colSpan="8" className="text-center py-20 opacity-30">Загрузка данных...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-20 opacity-50">Списаний не найдено</td>
                </tr>
              ) : items.map(row => (
                <tr 
                  key={row.id} 
                  onClick={() => toggleSelection(row.id)}
                  className={`transition-all cursor-pointer ${
                    selectedIds.includes(row.id) ? 'bg-blue-600/20 ring-1 ring-blue-500' : 'bg-slate-900 hover:bg-slate-800 shadow-sm'
                  } rounded-xl overflow-hidden`}
                >
                  <td className="px-4 py-4 rounded-l-xl">
                    <input type="checkbox" checked={selectedIds.includes(row.id)} readOnly />
                  </td>
                  <td className="px-4 py-4 font-mono text-xs opacity-50">{row.id}</td>
                  <td className="px-4 py-4">
                    <div className="font-bold">{row.item?.name || '-'}</div>
                    <div className="text-[10px] opacity-40 uppercase">{row.item?.brand || ''}</div>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">{row.item?.inventory_number || '-'}</td>
                  <td className="px-4 py-4 text-sm opacity-70">{row.location?.name || '-'}</td>
                  <td className="px-4 py-4 text-sm">{row.date_written_off || '-'}</td>
                  <td className="px-4 py-4 text-sm opacity-70">{row.created_by?.username || '-'}</td>
                  <td className="px-4 py-4 text-sm opacity-70 truncate max-w-xs">{row.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ПАГИНАЦИЯ */}
          {totalCount > 0 && (
            <div className="mt-8 flex justify-center gap-4 items-center">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-slate-800 rounded disabled:opacity-20 hover:bg-slate-700"
              >
                Назад
              </button>
              <span className="flex items-center font-bold">
                Страница {page} из {Math.ceil(totalCount / 20)}
              </span>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={items.length < 20}
                className="p-2 bg-slate-800 rounded disabled:opacity-20 hover:bg-slate-700"
              >
                Вперед
              </button>
              <span className="text-sm opacity-50 ml-4">Всего: {totalCount}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScrapPage;


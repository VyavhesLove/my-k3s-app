import React from 'react';

const WriteoffFilters = ({ 
  filters, 
  options = {},
  optionsLoading = false,
  onSearch, 
  onToggleLocation, 
  onToggleName,
  onDateChange,
  onReset,
  isDarkMode = false
}) => {
  return (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
      <div className="flex flex-wrap items-end gap-4">
        {/* Поиск по тексту */}
        <div>
          <label className={`block text-xs font-bold uppercase opacity-50 mb-1`}>Поиск</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Название, инв. номер..."
            className={`px-3 py-2 border rounded-lg w-48 ${
              isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
            }`}
          />
        </div>
        
        {/* Локации */}
        <div>
          <label className={`block text-xs font-bold uppercase opacity-50 mb-1`}>Локация</label>
          <select
            value={filters.locations.length === 1 ? filters.locations[0] : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                onToggleLocation(parseInt(value));
              }
            }}
            className={`px-3 py-2 border rounded-lg min-w-40 ${
              isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
            }`}
          >
            <option value="">Все локации</option>
            {optionsLoading ? (
              <option>Загрузка...</option>
            ) : (
              options.locations?.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))
            )}
          </select>
        </div>
        
        {/* Наименования */}
        <div>
          <label className={`block text-xs font-bold uppercase opacity-50 mb-1`}>Наименование</label>
          <select
            value={filters.names.length === 1 ? filters.names[0] : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                onToggleName(value);
              }
            }}
            className={`px-3 py-2 border rounded-lg min-w-40 ${
              isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
            }`}
          >
            <option value="">Все наименования</option>
            {optionsLoading ? (
              <option>Загрузка...</option>
            ) : (
              options.names?.map(name => (
                <option key={name} value={name}>{name}</option>
              ))
            )}
          </select>
        </div>
        
        {/* Фильтр по дате */}
        <div>
          <label className={`block text-xs font-bold uppercase opacity-50 mb-1`}>Дата</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onDateChange(e.target.value)}
            className={`px-3 py-2 border rounded-lg ${
              isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
            }`}
          />
        </div>
        
        {/* Сброс фильтров */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode 
                ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Сбросить
          </button>
        </div>
      </div>
    </div>
  );
};

export default WriteoffFilters;


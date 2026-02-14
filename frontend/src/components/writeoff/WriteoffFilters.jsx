import React from 'react';

const WriteoffFilters = ({ 
  filters, 
  onSearch, 
  onToggleLocation, 
  onToggleName,
  onDateChange,
  onReset 
}) => {
  return (
    <div className="bg-gray-100 p-4 rounded mb-4">
      <div className="flex flex-wrap gap-4">
        {/* Поиск по тексту */}
        <div>
          <label className="block text-sm font-medium mb-1">Поиск</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Название, инв. номер..."
            className="px-3 py-2 border rounded w-64"
          />
        </div>
        
        {/* Фильтр по дате */}
        <div>
          <label className="block text-sm font-medium mb-1">Дата списания</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
        
        {/* Сброс фильтров */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Сбросить
          </button>
        </div>
      </div>
    </div>
  );
};

export default WriteoffFilters;


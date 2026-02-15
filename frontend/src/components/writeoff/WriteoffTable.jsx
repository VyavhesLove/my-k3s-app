import React from 'react';
import api from '@/api/axios';

const WriteoffTable = ({ 
  data, 
  loading, 
  error, 
  isCancelledView,
  totalCount = 0,
  currentPage = 1,
  onPageChange,
  selectedIds = [],
  onToggleSelection,
  onToggleAllSelection,
  isDarkMode = false
}) => {
  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleCancelWriteoff = async (writeOffId) => {
    if (!window.confirm('Вы уверены, что хотите отменить это списание?')) {
      return;
    }
    
    try {
      await api.post(`/writeoffs/${writeOffId}/cancel/`);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка при отмене списания');
    }
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  if (loading) {
    return (
      <div className={`text-center py-20 ${isDarkMode ? 'opacity-30' : ''}`}>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return <div className={`text-red-500 py-4`}>{error}</div>;
  }

  if (data.length === 0) {
    return <div className={`text-center py-20 ${isDarkMode ? 'opacity-50' : 'text-gray-500'}`}>Списаний не найдено</div>;
  }

  return (
    <div>
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className={`text-[10px] uppercase ${isDarkMode ? 'opacity-40' : 'text-gray-500'}`}>
            <th className="px-4 pb-2">
              <input 
                type="checkbox" 
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => onToggleAllSelection?.(e.target.checked)}
              />
            </th>
            <th className="px-4 pb-2">ID</th>
            <th className="px-4 pb-2">ТМЦ</th>
            <th className="px-4 pb-2">Инв. номер</th>
            <th className="px-4 pb-2">Локация</th>
            <th className="px-4 pb-2">Дата списания</th>
            <th className="px-4 pb-2">Создатель</th>
            <th className="px-4 pb-2">Описание</th>
            {!isCancelledView && (
              <th className="px-4 pb-2">Действия</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr 
              key={item.id} 
              onClick={() => onToggleSelection?.(item.id)}
              className={`transition-all cursor-pointer ${
                selectedIds.includes(item.id) 
                  ? 'bg-blue-600/20 ring-1 ring-blue-500' 
                  : isDarkMode 
                    ? 'bg-slate-900 hover:bg-slate-800 shadow-sm' 
                    : 'bg-white hover:bg-gray-50 shadow-sm'
              } rounded-xl overflow-hidden`}
            >
              <td className="px-4 py-4 rounded-l-xl">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(item.id)} 
                  onChange={() => {}}
                  onClick={(e) => e.stopPropagation()}
                  readOnly 
                />
              </td>
              <td className={`px-4 py-4 font-mono text-xs ${isDarkMode ? 'opacity-50' : 'text-gray-500'}`}>
                {item.id}
              </td>
              <td className="px-4 py-4">
                <div className="font-bold">{item.name || '-'}</div>
                {item.brand && (
                  <div className={`text-[10px] uppercase ${isDarkMode ? 'opacity-40' : 'text-gray-400'}`}>
                    {item.brand}
                  </div>
                )}
              </td>
              <td className="px-4 py-4 font-medium">{item.serial || '-'}</td>
              <td className={`px-4 py-4 ${isDarkMode ? 'opacity-70' : 'text-gray-600'}`}>
                {item.location_name || item.location || '-'}
              </td>
              <td className="px-4 py-4">{item.date_written_off || '-'}</td>
              <td className={`px-4 py-4 ${isDarkMode ? 'opacity-70' : 'text-gray-600'}`}>
                {item.created_by_username || '-'}
              </td>
              <td className={`px-4 py-4 truncate max-w-xs ${isDarkMode ? 'opacity-70' : 'text-gray-600'}`}>
                {item.description || '-'}
              </td>
              {!isCancelledView && (
                <td className="px-4 py-4 rounded-r-xl">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelWriteoff(item.id);
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Отменить
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-4 items-center">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded disabled:opacity-20 hover:bg-opacity-80 ${
              isDarkMode ? 'bg-slate-800' : 'bg-gray-200'
            }`}
          >
            Назад
          </button>
          <span className="font-medium">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded disabled:opacity-20 hover:bg-opacity-80 ${
              isDarkMode ? 'bg-slate-800' : 'bg-gray-200'
            }`}
          >
            Вперёд
          </button>
          <span className={`text-sm ml-4 ${isDarkMode ? 'opacity-50' : 'text-gray-500'}`}>
            Всего: {totalCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default WriteoffTable;


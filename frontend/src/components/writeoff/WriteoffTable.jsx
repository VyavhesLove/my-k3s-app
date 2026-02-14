import React from 'react';
import api from '@/api/axios';

const WriteoffTable = ({ 
  data, 
  loading, 
  error, 
  isCancelledView,
  totalCount = 0,
  currentPage = 1,
  onPageChange 
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

  if (loading) {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="text-gray-500 py-4">Списаний не найдено</div>;
  }

  return (
    <div>
      <table className="w-full border-collapse border border-gray-300 mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-4 py-2">ID</th>
            <th className="border border-gray-300 px-4 py-2">ТМЦ</th>
            <th className="border border-gray-300 px-4 py-2">Инв. номер</th>
            <th className="border border-gray-300 px-4 py-2">Локация</th>
            <th className="border border-gray-300 px-4 py-2">Дата списания</th>
            <th className="border border-gray-300 px-4 py-2">Создатель</th>
            <th className="border border-gray-300 px-4 py-2">Описание</th>
            {!isCancelledView && (
              <th className="border border-gray-300 px-4 py-2">Действия</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-100">
              <td className="border border-gray-300 px-4 py-2">{item.id}</td>
              <td className="border border-gray-300 px-4 py-2">
                {item.item?.name || '-'}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {item.item?.inventory_number || '-'}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {item.location?.name || '-'}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {item.date_written_off || '-'}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {item.created_by?.username || '-'}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {item.description || '-'}
              </td>
              {!isCancelledView && (
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    onClick={() => handleCancelWriteoff(item.id)}
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
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Назад
          </button>
          <span className="px-3 py-1">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
};

export default WriteoffTable;


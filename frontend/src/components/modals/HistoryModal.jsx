import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, History } from 'lucide-react';
import api from '@/api/axios';
import { toast } from 'sonner';

// Skeleton для истории
const HistorySkeleton = () => (
  [...Array(5)].map((_, index) => (
    <tr key={index} className="animate-pulse">
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-24"></div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-40"></div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-20"></div>
      </td>
    </tr>
  ))
);

const HistoryModal = ({ isOpen, onClose, item, isDarkMode }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false
  });

  // Загрузка истории при открытии или смене страницы
  useEffect(() => {
    if (isOpen && item) {
      fetchHistory(pagination.page, pagination.page_size);
    }
  }, [isOpen, item, pagination.page, pagination.page_size]);

  const fetchHistory = async (page, pageSize) => {
    setLoading(true);
    try {
      const response = await api.get(`/items/${item.id}/history/`, {
        params: { page, page_size: pageSize }
      });
      
      if (response.data.success) {
        setHistory(response.data.data.history);
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (err) {
      toast.error('Не удалось загрузить историю');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, page_size: newSize, page: 1 }));
  };

  if (!isOpen || !item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={`w-full max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col transform transition-all ${
          isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
        }`}
      >
        {/* Шапка */}
        <div className="flex justify-between items-center p-6 border-b border-gray-500/10 shrink-0">
          <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            <History size={24} />
            История операций
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Информация о ТМЦ */}
        <div className={`px-6 py-3 text-sm ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
          <span className="font-medium">{item.name}</span>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-gray-500">{item.serial || '—'}</span>
        </div>

        {/* Таблица истории */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-xs text-left border-collapse">
            <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
              <tr>
                <th className="p-3 font-bold border-b border-gray-500/10">Дата</th>
                <th className="p-3 font-bold border-b border-gray-500/10">Операция</th>
                <th className="p-3 font-bold border-b border-gray-500/10">Отв.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-500/10">
              {loading ? (
                <HistorySkeleton />
              ) : history.length > 0 ? (
                history.map((h, i) => (
                  <tr key={i} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}>
                    <td className="p-3 whitespace-nowrap opacity-70">{h.date}</td>
                    <td className="p-3 leading-relaxed">{h.action}</td>
                    <td className="p-3 font-medium">{h.user_username || h.user || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                    История операций пуста
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {!loading && pagination.total_count > 0 && (
          <div 
            className={`px-6 py-4 flex items-center justify-between border-t shrink-0 ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Показать:
              </span>
              <select 
                value={pagination.page_size} 
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className={`rounded px-2 py-1 text-xs focus:outline-none ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-gray-50 border-gray-200'
                } border`}
              >
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {pagination.total_count} записей
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)} 
                  disabled={!pagination.has_prev}
                  className={`p-1.5 rounded-lg transition-colors ${
                    pagination.has_prev 
                      ? 'hover:bg-blue-500/20 text-blue-500' 
                      : 'opacity-30 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                
                <span className="text-sm font-medium min-w-[80px] text-center">
                  {pagination.page} / {pagination.total_pages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)} 
                  disabled={!pagination.has_next}
                  className={`p-1.5 rounded-lg transition-colors ${
                    pagination.has_next 
                      ? 'hover:bg-blue-500/20 text-blue-500' 
                      : 'opacity-30 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;


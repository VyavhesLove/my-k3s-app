import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
} from '@tanstack/react-table';
import { X, LogOut, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getUserSessions, terminateSession, terminateAllSessions } from '@/api/userApi';
import GenericTable from '../table/GenericTable';

// Хелпер для создания колонок
const columnHelper = createColumnHelper();

// Форматтер для даты
const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Skeleton загрузки
const SessionsSkeleton = () => (
  [...Array(5)].map((_, index) => (
    <tr key={index} className="animate-pulse">
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-12"></div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-48"></div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-28"></div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-32"></div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-32"></div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-24"></div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-gray-300/20 rounded w-16"></div>
      </td>
    </tr>
  ))
);

// Пустое состояние
const EmptySessionsState = ({ isDarkMode }) => (
  <tr>
    <td colSpan={7} className="p-12">
      <div className={`flex flex-col items-center justify-center text-center rounded-xl py-8 mx-4 ${
        isDarkMode 
          ? 'bg-slate-800/30 border border-slate-700/50' 
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          isDarkMode ? 'bg-slate-700/50' : 'bg-gray-200'
        }`}>
          <Users size={32} className={isDarkMode ? 'text-slate-400' : 'text-gray-400'} />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${
          isDarkMode ? 'text-slate-300' : 'text-gray-700'
        }`}>
          Нет активных сеансов
        </h3>
        <p className={`text-sm max-w-xs ${
          isDarkMode ? 'text-slate-500' : 'text-gray-500'
        }`}>
          У этого пользователя нет активных сессий
        </p>
      </div>
    </td>
  </tr>
);

const SessionsModal = ({ isOpen, onClose, user, isDarkMode }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTerminating, setIsTerminating] = useState(false);
  const [error, setError] = useState(null);

  // Загрузка данных при открытии
  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const rawData = await getUserSessions(user.id);
      // Гарантируем, что sessions всегда массив
      let sessionsArray = [];
      if (Array.isArray(rawData)) {
        sessionsArray = rawData;
      } else if (rawData?.data && Array.isArray(rawData.data)) {
        sessionsArray = rawData.data;
      } else {
        console.warn('Unexpected sessions data format:', rawData);
      }
      setSessions(sessionsArray);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      const errorMessage = err?.error || 'Не удалось загрузить сеансы';
      setError(errorMessage);
      toast.error(errorMessage);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchSessions();
    }
  }, [isOpen, user?.id, fetchSessions]);

  // Завершение одной сессии
  const handleTerminateSession = useCallback(async (sessionId) => {
    if (isTerminating || !user?.id) return;
    
    setIsTerminating(true);
    try {
      const result = await terminateSession(user.id, sessionId);
      toast.success(result?.message || 'Сессия завершена');
      // Обновляем список сессий - защита от undefined
      setSessions(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.filter(s => s.id !== sessionId);
      });
    } catch (err) {
      const errorMessage = err?.error || 'Не удалось завершить сессию';
      toast.error(errorMessage);
    } finally {
      setIsTerminating(false);
    }
  }, [isTerminating, user?.id]);

  // Завершение всех сессий
  const handleTerminateAllSessions = async () => {
    if (isTerminating || sessions.length === 0 || !user?.id) return;
    
    // Подтверждение
    if (!confirm(`Вы уверены, что хотите завершить все ${sessions.length} сессий пользователя?`)) {
      return;
    }
    
    setIsTerminating(true);
    try {
      const result = await terminateAllSessions(user.id);
      toast.success(result.message || `Завершено сессий: ${result.terminated_count}`);
      // Очищаем список
      setSessions([]);
      // Закрываем модальное окно
      onClose();
    } catch (err) {
      const errorMessage = err?.error || 'Не удалось завершить сессии';
      toast.error(errorMessage);
    } finally {
      setIsTerminating(false);
    }
  };

  // Определение колонок с использованием TanStack Table v8
  // Защита: убеждаемся что sessions массив
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  
  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => (
        <span className={`font-mono text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          {info.getValue()}
        </span>
      ),
      size: 60,
    }),
    columnHelper.accessor('user_agent', {
      header: 'Устройство',
      cell: info => (
        <span className="text-sm" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
      size: 200,
    }),
    columnHelper.accessor('ip_address', {
      header: 'IP адрес',
      cell: info => (
        <span className={`font-mono text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {info.getValue()}
        </span>
      ),
      size: 130,
    }),
    columnHelper.accessor('created_at', {
      header: 'Создана',
      cell: info => (
        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          {formatDate(info.getValue())}
        </span>
      ),
      size: 150,
    }),
    columnHelper.accessor('last_activity', {
      header: 'Активность',
      cell: info => (
        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          {formatDate(info.getValue())}
        </span>
      ),
      size: 150,
    }),
    columnHelper.accessor('description', {
      header: 'Описание',
      cell: info => (
        <span className="text-sm">
          {info.getValue() || '—'}
        </span>
      ),
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Действие',
      cell: ({ row }) => {
        const sessionId = row.original.id;
        const isCurrent = row.original.is_current;
        return (
          <button
            onClick={() => handleTerminateSession(sessionId)}
            disabled={isTerminating}
            className={`p-2 rounded-lg transition-all active:scale-95 ${
              isDarkMode
                ? 'hover:bg-red-500/20 text-red-400'
                : 'hover:bg-red-100 text-red-600'
            } ${isTerminating ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isCurrent ? 'Завершить эту сессию' : 'Выход'}
          >
            <LogOut size={16} />
          </button>
        );
      },
      size: 80,
    }),
  ], [isDarkMode, isTerminating, handleTerminateSession]);

  // Конфигурация таблицы - используем safeSessions для защиты
  const table = useReactTable({
    data: safeSessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'last_activity', desc: true }],
    },
  });

  if (!isOpen || !user) {
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
            <Users size={24} />
            Сеансы пользователя
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Информация о пользователе */}
        <div className={`px-6 py-3 text-sm flex items-center gap-4 ${
          isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Пользователь:</span>
            <span className="font-medium">{user.username}</span>
          </div>
          <span className="text-gray-400">|</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Всего сессий:</span>
            <span className={`font-bold ${
              sessions.length > 0 
                ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                : (isDarkMode ? 'text-slate-400' : 'text-gray-500')
            }`}>
              {sessions.length}
            </span>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className={`mx-6 mt-4 p-4 rounded-xl flex items-center gap-3 ${
            isDarkMode 
              ? 'bg-red-500/20 border border-red-500/30' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <AlertTriangle size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
            <span className={isDarkMode ? 'text-red-400' : 'text-red-700'}>{error}</span>
          </div>
        )}

        {/* Таблица сессий */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {isLoading ? (
            <div className={`rounded-xl border ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <table className="w-full text-xs text-left border-collapse">
                <thead className={`sticky top-0 z-10 ${
                  isDarkMode ? 'bg-slate-800' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className="p-3 font-bold border-b border-gray-500/10">ID</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Устройство</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">IP адрес</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Создана</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Активность</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Описание</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  <SessionsSkeleton />
                </tbody>
              </table>
            </div>
          ) : sessions.length === 0 ? (
            <div className={`rounded-xl border ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <table className="w-full text-xs text-left border-collapse">
                <thead className={`sticky top-0 z-10 ${
                  isDarkMode ? 'bg-slate-800' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className="p-3 font-bold border-b border-gray-500/10">ID</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Устройство</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">IP адрес</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Создана</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Активность</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Описание</th>
                    <th className="p-3 font-bold border-b border-gray-500/10">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  <EmptySessionsState isDarkMode={isDarkMode} />
                </tbody>
              </table>
            </div>
          ) : (
            <GenericTable 
              table={table} 
              emptyMessage="Нет данных о сессиях"
              styles={{
                container: {
                  borderRadius: '12px',
                },
                wrapper: {
                  maxHeight: 'calc(100vh - 450px)',
                },
              }}
            />
          )}
        </div>

        {/* Футер с кнопками */}
        <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {sessions.length} {sessions.length === 1 ? 'сессия' : sessions.length >= 2 && sessions.length <= 4 ? 'сессии' : 'сессий'}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleTerminateAllSessions}
              disabled={isTerminating || sessions.length === 0}
              className={`py-2.5 px-4 flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 ${
                isDarkMode
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isTerminating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <LogOut size={16} />
              )}
              Завершить все сеансы
            </button>
            
            <button
              onClick={onClose}
              className={`py-2.5 px-4 rounded-xl font-medium transition-all active:scale-95 ${
                isDarkMode
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SessionsModal };
export default SessionsModal;


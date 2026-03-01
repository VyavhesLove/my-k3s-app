/**
 * Компонент таблицы URL-адресов для настроек Maintenance Mode.
 * Позволяет добавлять и удалять URL (regex паттерны) из списка разрешённых.
 */
import React, { useState } from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { useMaintenanceSettingsStore } from '@/store/useMaintenanceSettingsStore';
import { isValidUrlRegex } from '@/schemas/maintenance';
import GenericTable from '@/components/table/GenericTable';
import { X, Plus, Globe } from 'lucide-react';

// Хелпер для создания колонок
const columnHelper = createColumnHelper();

const UrlsTable = ({ isDarkMode }) => {
  const { settings, addUrl, removeUrl, loading } = useMaintenanceSettingsStore();
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  const urls = settings.urls || [];

  // Функция добавления URL
  const handleAddUrl = async () => {
    setError('');
    
    if (!newUrl.trim()) {
      setError('Введите URL паттерн');
      return;
    }

    if (!isValidUrlRegex(newUrl.trim())) {
      setError('Некорректный regex паттерн');
      return;
    }

    if (urls.includes(newUrl.trim())) {
      setError('URL уже существует в списке');
      return;
    }

    const result = await addUrl(newUrl.trim());
    if (result.success) {
      setNewUrl('');
    } else {
      setError(result.error || 'Ошибка добавления URL');
    }
  };

  // Функция удаления URL
  const handleRemoveUrl = async (url) => {
    await removeUrl(url);
  };

  // Обработчик клавиши Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddUrl();
    }
  };

  // Колонки таблицы
  const columns = [
    columnHelper.accessor('url', {
      header: 'URL паттерн',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-500" />
          <span className="font-mono text-sm">{row.original.url}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <button
          onClick={() => handleRemoveUrl(row.original.url)}
          disabled={loading}
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          title="Удалить URL"
        >
          <X className="w-4 h-4" />
        </button>
      ),
      enableSorting: false,
    }),
  ];

  // Подготовка данных
  const data = urls.map(url => ({ url }));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    autoSortColumn: false,
  });

  return (
    <div className="space-y-4">
      {/* Форма добавления URL */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newUrl}
          onChange={(e) => {
            setNewUrl(e.target.value);
            setError('');
          }}
          onKeyPress={handleKeyPress}
          placeholder="Введите URL паттерн (regex, например, /api/health)"
          className={`flex-1 px-4 py-2 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          disabled={loading}
        />
        <button
          onClick={handleAddUrl}
          disabled={loading || !newUrl.trim()}
          className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Подсказка о regex */}
      <div className={`p-3 rounded-lg ${
        isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
      }`}>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <Globe className="w-3 h-3 inline-block mr-1" />
          URL паттерны поддерживают <strong>regex</strong>. Например: <code className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>/api/*</code> разрешит все пути, начинающиеся с <code className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>/api/</code>
        </p>
      </div>

      {/* Таблица */}
      <GenericTable
        table={table}
        emptyMessage="Нет разрешённых URL"
      />
    </div>
  );
};

export default UrlsTable;


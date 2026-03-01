/**
 * Компонент таблицы IP-адресов для настроек Maintenance Mode.
 * Позволяет добавлять и удалять IP-адреса из списка разрешённых.
 */
import React, { useState } from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { useMaintenanceSettingsStore } from '@/store/useMaintenanceSettingsStore';
import { isValidIp } from '@/schemas/maintenance';
import GenericTable from '@/components/table/GenericTable';
import { X, Plus, Wifi } from 'lucide-react';

// Хелпер для создания колонок
const columnHelper = createColumnHelper();

const IpsTable = ({ isDarkMode }) => {
  const { settings, addIp, removeIp, loading } = useMaintenanceSettingsStore();
  const [newIp, setNewIp] = useState('');
  const [error, setError] = useState('');

  const ips = settings.ips || [];

  // Функция добавления IP
  const handleAddIp = async () => {
    setError('');
    
    if (!newIp.trim()) {
      setError('Введите IP-адрес');
      return;
    }

    if (!isValidIp(newIp.trim())) {
      setError('Некорректный IP-адрес');
      return;
    }

    if (ips.includes(newIp.trim())) {
      setError('IP-адрес уже существует в списке');
      return;
    }

    const result = await addIp(newIp.trim());
    if (result.success) {
      setNewIp('');
    } else {
      setError(result.error || 'Ошибка добавления IP');
    }
  };

  // Функция удаления IP
  const handleRemoveIp = async (ip) => {
    await removeIp(ip);
  };

  // Обработчик клавиши Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddIp();
    }
  };

  // Колонки таблицы
  const columns = [
    columnHelper.accessor('ip', {
      header: 'IP-адрес',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="font-mono">{row.original.ip}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <button
          onClick={() => handleRemoveIp(row.original.ip)}
          disabled={loading}
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          title="Удалить IP"
        >
          <X className="w-4 h-4" />
        </button>
      ),
      enableSorting: false,
    }),
  ];

  // Подготовка данных
  const data = ips.map(ip => ({ ip }));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    autoSortColumn: false,
  });

  return (
    <div className="space-y-4">
      {/* Форма добавления IP */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newIp}
          onChange={(e) => {
            setNewIp(e.target.value);
            setError('');
          }}
          onKeyPress={handleKeyPress}
          placeholder="Введите IP-адрес (например, 192.168.1.1)"
          className={`flex-1 px-4 py-2 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          disabled={loading}
        />
        <button
          onClick={handleAddIp}
          disabled={loading || !newIp.trim()}
          className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Таблица */}
      <GenericTable
        table={table}
        emptyMessage="Нет разрешённых IP-адресов"
      />
    </div>
  );
};

export default IpsTable;


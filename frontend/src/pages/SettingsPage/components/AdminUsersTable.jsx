/**
 * Компонент таблицы пользователей с ролью Admin для настроек Maintenance Mode.
 * Отображает пользователей, которые имеют доступ в режиме обслуживания.
 * Только чтение - нельзя добавлять/удалять.
 */
import React from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { useMaintenanceSettingsStore } from '@/store/useMaintenanceSettingsStore';
import GenericTable from '@/components/table/GenericTable';
import { Shield, User, Mail } from 'lucide-react';

// Хелпер для создания колонок
const columnHelper = createColumnHelper();

const AdminUsersTable = ({ isDarkMode }) => {
  const { settings } = useMaintenanceSettingsStore();

  // Получаем список admin users из store
  const adminUsers = settings.admin_users || [];

  // Данные для таблицы (массив объектов с информацией о пользователях)
  const data = adminUsers.map(username => ({
    username,
    // В будущем можно добавить больше полей, если получим их с бэкенда
  }));

  // Колонки таблицы
  const columns = [
    columnHelper.accessor('username', {
      header: 'Логин',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{row.original.username}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'role',
      header: 'Роль',
      cell: () => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-orange-500" />
          <span className="px-2 py-1 bg-orange-500/20 text-orange-500 rounded text-xs font-medium">
            Admin
          </span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'access',
      header: 'Доступ в режиме обслуживания',
      cell: () => (
        <div className="flex items-center gap-2 text-green-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm">Имеет доступ</span>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    autoSortColumn: false,
  });

  return (
    <div className="space-y-4">
      {/* Информация о том, что таблица только для чтения */}
      <div className={`p-3 rounded-lg ${
        isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
      }`}>
        <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
          <Shield className="w-4 h-4 inline-block mr-2" />
          Пользователи с ролью <strong>Admin</strong> автоматически получают доступ к системе во время режима обслуживания.
          Это настраивается в профиле пользователя.
        </p>
      </div>

      {/* Таблица */}
      <GenericTable
        table={table}
        emptyMessage="Нет пользователей с ролью Admin"
      />
    </div>
  );
};

export default AdminUsersTable;


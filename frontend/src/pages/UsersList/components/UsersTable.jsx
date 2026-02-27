import TableSkeleton from '@/components/inventory/TableSkeleton';
import RoleFilter from '@/components/users/RoleFilter';
import EmptyState from './EmptyState';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getRoleText } from '@/utils/role';

// Стили для ролей
const getRoleStyles = (role, isDarkMode) => {
  const styles = {
    admin: isDarkMode
      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
      : 'bg-purple-100 text-purple-700 border border-purple-200',
    storekeeper: isDarkMode
      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      : 'bg-blue-100 text-blue-700 border border-blue-200',
    foreman: isDarkMode
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : 'bg-green-100 text-green-700 border border-green-200',
  };
  return styles[role] || (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500');
};

export const UsersTable = ({ 
  users, 
  usersLoading, 
  currentPage, 
  pageSize,
  sortConfig,
  filters,
  handleSortClick,
  handleFilterChange,
  onClearSearch,
  isDarkMode 
}) => {
  // Получаем направление сортировки для каждой колонки
  const getSortDirection = (key) => {
    const sort = sortConfig?.find(s => s.key === key);
    return sort?.direction || null;
  };

  // Проверяем является ли колонка основной для сортировки
  const isPrimarySort = (key) => {
    return sortConfig?.length > 0 && sortConfig[0].key === key;
  };

  if (usersLoading) {
    return (
      <div className="h-full rounded-xl shadow-2xl overflow-hidden border"
        style={{
          backgroundColor: 'var(--table-bg)',
          borderColor: 'var(--table-border)'
        }}>
        {/* Header */}
        <div 
          className="flex border-b px-4 py-3 sticky top-0 z-50"
          style={{ 
            backgroundColor: 'var(--table-header-bg)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderColor: 'var(--table-border)'
          }}
        >
          <div className="w-12 text-xs font-bold text-left flex-shrink-0">№</div>
          <div className="flex-1 min-w-[120px] text-xs font-semibold uppercase tracking-wider">Логин</div>
          <div className="flex-1 min-w-[150px] text-xs font-semibold uppercase tracking-wider">Email</div>
          <div className="flex-1 min-w-[100px] text-xs font-semibold uppercase tracking-wider">Имя</div>
          <div className="flex-1 min-w-[100px] text-xs font-semibold uppercase tracking-wider">Фамилия</div>
          <div className="flex-1 min-w-[120px] text-xs font-semibold uppercase tracking-wider">Роль</div>
        </div>
        
        {/* Skeleton */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)', backgroundColor: 'var(--table-bg)' }}>
          <TableSkeleton columns={6} rows={pageSize} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-2xl overflow-hidden border"
      style={{
        backgroundColor: 'var(--table-bg)',
        borderColor: 'var(--table-border)'
      }}
    >
      {/* Header */}
      <div 
        className="flex border-b px-4 py-3 sticky top-0 z-50"
        style={{ 
          backgroundColor: 'var(--table-header-bg)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderColor: 'var(--table-border)'
        }}
      >
        {/* № */}
        <div className="w-12 text-xs font-bold text-left flex-shrink-0">№</div>
        
        {/* Логин */}
        <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
          <div 
            className={`flex items-center gap-1 cursor-pointer hover:text-blue-400 ${getSortDirection('username') ? 'text-blue-400' : ''}`}
            onClick={() => handleSortClick('username')}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">Логин</span>
            {getSortDirection('username') === 'asc' ? (
              <ArrowUp size={14} />
            ) : getSortDirection('username') === 'desc' ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={12} className="opacity-50" />
            )}
            {isPrimarySort('username') && sortConfig.length > 1 && (
              <span className="text-[10px] bg-blue-600 px-1 rounded">{sortConfig.length}</span>
            )}
          </div>
          <input
            placeholder="Поиск..."
            value={filters.username || ''}
            onChange={(e) => handleFilterChange('username', e.target.value)}
            className="input-theme pl-7 pr-2 py-2 text-xs w-full rounded focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <div 
            className={`flex items-center gap-1 cursor-pointer hover:text-blue-400 ${getSortDirection('email') ? 'text-blue-400' : ''}`}
            onClick={() => handleSortClick('email')}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">Email</span>
            {getSortDirection('email') === 'asc' ? (
              <ArrowUp size={14} />
            ) : getSortDirection('email') === 'desc' ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={12} className="opacity-50" />
            )}
            {isPrimarySort('email') && sortConfig.length > 1 && (
              <span className="text-[10px] bg-blue-600 px-1 rounded">{sortConfig.length}</span>
            )}
          </div>
          <input
            placeholder="Поиск..."
            value={filters.email || ''}
            onChange={(e) => handleFilterChange('email', e.target.value)}
            className="input-theme pl-7 pr-2 py-2 text-xs w-full rounded focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Имя */}
        <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
          <div 
            className={`flex items-center gap-1 cursor-pointer hover:text-blue-400 ${getSortDirection('first_name') ? 'text-blue-400' : ''}`}
            onClick={() => handleSortClick('first_name')}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">Имя</span>
            {getSortDirection('first_name') === 'asc' ? (
              <ArrowUp size={14} />
            ) : getSortDirection('first_name') === 'desc' ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={12} className="opacity-50" />
            )}
            {isPrimarySort('first_name') && sortConfig.length > 1 && (
              <span className="text-[10px] bg-blue-600 px-1 rounded">{sortConfig.length}</span>
            )}
          </div>
          <input
            placeholder="Поиск..."
            value={filters.first_name || ''}
            onChange={(e) => handleFilterChange('first_name', e.target.value)}
            className="input-theme pl-7 pr-2 py-2 text-xs w-full rounded focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Фамилия */}
        <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
          <div 
            className={`flex items-center gap-1 cursor-pointer hover:text-blue-400 ${getSortDirection('last_name') ? 'text-blue-400' : ''}`}
            onClick={() => handleSortClick('last_name')}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">Фамилия</span>
            {getSortDirection('last_name') === 'asc' ? (
              <ArrowUp size={14} />
            ) : getSortDirection('last_name') === 'desc' ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={12} className="opacity-50" />
            )}
            {isPrimarySort('last_name') && sortConfig.length > 1 && (
              <span className="text-[10px] bg-blue-600 px-1 rounded">{sortConfig.length}</span>
            )}
          </div>
          <input
            placeholder="Поиск..."
            value={filters.last_name || ''}
            onChange={(e) => handleFilterChange('last_name', e.target.value)}
            className="input-theme pl-7 pr-2 py-2 text-xs w-full rounded focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Роль */}
        <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
          <div 
            className={`flex items-center gap-1 cursor-pointer hover:text-blue-400 ${getSortDirection('role') ? 'text-blue-400' : ''}`}
            onClick={() => handleSortClick('role')}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">Роль</span>
            {getSortDirection('role') === 'asc' ? (
              <ArrowUp size={14} />
            ) : getSortDirection('role') === 'desc' ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={12} className="opacity-50" />
            )}
            {isPrimarySort('role') && sortConfig.length > 1 && (
              <span className="text-[10px] bg-blue-600 px-1 rounded">{sortConfig.length}</span>
            )}
          </div>
          <RoleFilter 
            isDarkMode={isDarkMode} 
            filterValue={filters.role} 
            onFilterChange={(value) => handleFilterChange('role', value)} 
          />
        </div>
      </div>

      {/* Body */}
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)', backgroundColor: 'var(--table-bg)' }}>
        {users.length === 0 ? (
          <div className="w-full h-[200px] flex items-center justify-center">
            <EmptyState searchQuery={filters.search || ''} onClearSearch={onClearSearch} />
          </div>
        ) : (
          <>
            {users.map((user, index) => (
              <div 
                key={user.id} 
                className="flex border-b items-center hover:bg-blue-500/5"
                style={{ borderColor: 'var(--table-border)' }}
              >
                <div className="w-12 px-4 py-4 text-xs font-medium flex-shrink-0">
                  {(currentPage - 1) * pageSize + index + 1}
                </div>
                <div className="px-4 py-4 text-sm flex-1 min-w-[120px] font-medium">
                  {user.username}
                </div>
                <div className="px-4 py-4 text-sm flex-1 min-w-[150px] opacity-70">
                  {user.email}
                </div>
                <div className="px-4 py-4 text-sm flex-1 min-w-[100px]">
                  {user.first_name || '—'}
                </div>
                <div className="px-4 py-4 text-sm flex-1 min-w-[100px]">
                  {user.last_name || '—'}
                </div>
                <div className="px-4 py-4 text-sm flex-1 min-w-[120px]">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRoleStyles(user.role?.name, isDarkMode)}`}>
                    {getRoleText(user.role)}
                  </span>
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, pageSize - users.length) }).map((_, index) => (
              <div key={`spacer-${index}`} className="flex h-[52px] border-b" style={{ borderColor: 'var(--table-border)' }} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersTable;


import TableSkeleton from '@/components/inventory/TableSkeleton';
import TableHeader from '@/components/inventory/TableHeader';
import RoleFilter from '@/components/users/RoleFilter';
import UserRow from './UserRow';
import EmptyState from './EmptyState';

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
  if (usersLoading) {
    return (
      <table className="w-full text-sm">
        <TableSkeleton columns={6} rows={pageSize} />
      </table>
    );
  }

  return (
    <div className="rounded-xl shadow-2xl overflow-hidden border"
      style={{
        backgroundColor: 'var(--table-bg)',
        borderColor: 'var(--table-border)'
      }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minHeight: '520px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
              <th className="px-4 py-3 text-left text-xs font-bold border-b w-12"
                style={{ borderColor: 'var(--table-border)' }}>№</th>
              <TableHeader 
                label="Логин" 
                sortKey="username" 
                isDarkMode={isDarkMode} 
                sortConfig={sortConfig} 
                handleSortClick={handleSortClick} 
                filters={filters} 
                handleFilterChange={handleFilterChange} 
              />
              <TableHeader 
                label="Email" 
                sortKey="email" 
                isDarkMode={isDarkMode} 
                sortConfig={sortConfig} 
                handleSortClick={handleSortClick} 
                filters={filters} 
                handleFilterChange={handleFilterChange} 
              />
              <TableHeader 
                label="Имя" 
                sortKey="first_name" 
                isDarkMode={isDarkMode} 
                sortConfig={sortConfig} 
                handleSortClick={handleSortClick} 
                filters={filters} 
                handleFilterChange={handleFilterChange} 
              />
              <TableHeader 
                label="Фамилия" 
                sortKey="last_name" 
                isDarkMode={isDarkMode} 
                sortConfig={sortConfig} 
                handleSortClick={handleSortClick} 
                filters={filters} 
                handleFilterChange={handleFilterChange} 
              />
              <TableHeader 
                label="Роль" 
                sortKey="role" 
                isDarkMode={isDarkMode} 
                sortConfig={sortConfig} 
                handleSortClick={handleSortClick} 
                filters={filters} 
                handleFilterChange={handleFilterChange} 
                customFilter={
                  <RoleFilter 
                    isDarkMode={isDarkMode} 
                    filterValue={filters.role} 
                    onFilterChange={(value) => handleFilterChange('role', value)} 
                  />
                } 
              />
            </tr>
          </thead>
          <tbody style={{ color: 'var(--table-text)', borderColor: 'var(--table-border)' }}>
            {users.length === 0 ? (
              <EmptyState searchQuery={filters.search || ''} onClearSearch={onClearSearch} />
            ) : (
              <>
                {users.map((user, index) => (
                  <UserRow 
                    key={user.id} 
                    user={user} 
                    index={index}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    isDarkMode={isDarkMode}
                  />
                ))}
                {Array.from({ length: Math.max(0, pageSize - users.length) }).map((_, index) => (
                  <tr key={`spacer-${index}`} className="h-[52px]">
                    <td colSpan={6} />
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


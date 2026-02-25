import { RefreshCw } from 'lucide-react';
import SearchBar from '@/components/inventory/SearchBar';
import Pagination from '@/components/inventory/Pagination';
import UsersTable from './components/UsersTable';
import { useUsers } from './hooks/useUsers';

function UsersList({ isDarkMode }) {
  const {
    users,
    usersLoading,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    filters,
    searchQuery,
    sortConfig,
    resetAllFilters,
    handleSearch,
    handleFilterChange,
    handleSortClick,
    onPageChange,
    onPageSizeChange,
  } = useUsers(isDarkMode);

  const handleClearSearch = () => {
    handleSearch('');
  };

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-primary">Пользователи</h1>
            
            <div className="flex items-center gap-3">
              <SearchBar 
                searchQuery={searchQuery} 
                onSearch={handleSearch} 
                isDarkMode={isDarkMode}
              />
              <button 
                onClick={resetAllFilters}
                disabled={usersLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg flex items-center gap-2 ${
                  isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${usersLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw size={16} className={usersLoading ? 'animate-spin' : ''} />
                Обновить
              </button>
            </div>
          </div>

          <UsersTable 
            users={users}
            usersLoading={usersLoading}
            currentPage={currentPage}
            pageSize={pageSize}
            sortConfig={sortConfig}
            filters={filters}
            handleSortClick={handleSortClick}
            handleFilterChange={handleFilterChange}
            onClearSearch={handleClearSearch}
            isDarkMode={isDarkMode}
          />

          {totalCount > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              isDarkMode={isDarkMode}
              totalCount={totalCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default UsersList;


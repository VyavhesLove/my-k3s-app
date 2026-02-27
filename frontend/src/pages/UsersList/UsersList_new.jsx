import { RefreshCw, UserPlus } from 'lucide-react';
import SearchBar from '@/components/inventory/SearchBar';
import UsersTable from './components/UsersTable_new';
import UserDetailPanel from '@/components/UserDetailPanel';
import { useUsers } from './hooks/useUsers';
import Pagination from '@/components/inventory/Pagination';
import { useUserStore } from '@/store/useUserStore';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
import { useState } from 'react';

function UsersList_new({ isDarkMode }) {
  const {
    users,
    usersLoading,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    filters,
    searchQuery,
    handleSearch,
    handleFilterChange,
    resetAllFilters,
    sortConfig,
    handleSortClick,
    onPageChange,
    onPageSizeChange,
  } = useUsers(isDarkMode);

  // Подключение к store для модалки
  const { 
    isCreateUserModalOpen, 
    openCreateUserModal, 
    closeCreateUserModal 
  } = useUserStore();

  // Состояние для выбранного пользователя (панель деталей)
  const [selectedUser, setSelectedUser] = useState(null);

  // Обработчик обновления данных пользователя (из панели деталей)
  const handleUserUpdate = (updatedUser) => {
    // Обновляем пользователя в store
    useUserStore.getState().updateUserLocally(updatedUser);
    // Также обновляем локальное состояние выбранного пользователя
    setSelectedUser(prev => prev ? { ...prev, ...updatedUser } : null);
  };

  // Обработчик клика на пользователя - открытие панели деталей
  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  // Обработчик закрытия панели деталей пользователя
  const handleCloseUserDetail = () => {
    setSelectedUser(null);
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--main-bg)' }}>
      {/* Header с кнопками */}
      <header className={`p-4 border-b flex flex-col gap-4 flex-shrink-0 ${
        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Пользователи</h1>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={openCreateUserModal}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg flex items-center gap-2 ${
                isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <UserPlus size={16} />
              Создать пользователя
            </button>
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
      </header>

      {/* Контент - таблица */}
      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto">
          <UsersTable
            users={users}
            usersLoading={usersLoading}
            currentPage={currentPage}
            pageSize={pageSize}
            filters={filters}
            handleFilterChange={handleFilterChange}
            isDarkMode={isDarkMode}
            sortConfig={sortConfig}
            handleSortClick={handleSortClick}
            onClearSearch={() => handleSearch('')}
            onUserClick={handleUserClick}
          />
        </div>
      </main>

      {/* Footer с пагинацией */}
      <footer className={`p-4 border-t flex-shrink-0 ${
        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto">
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
      </footer>

      {/* Модалка создания пользователя */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={closeCreateUserModal}
        isDarkMode={isDarkMode}
      />

      {/* Панель деталей пользователя */}
      <UserDetailPanel
        user={selectedUser}
        onClose={handleCloseUserDetail}
        isDarkMode={isDarkMode}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}

export default UsersList_new;


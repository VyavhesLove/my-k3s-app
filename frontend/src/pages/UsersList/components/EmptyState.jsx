import { Search } from 'lucide-react';

const EmptyState = ({ searchQuery, onClearSearch }) => {
  return (
    <tr>
      <td colSpan={6} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <Search size={32} className="text-gray-400" />
          <span className="text-gray-500">
            {searchQuery ? 'Ничего не найдено' : 'Нет пользователей'}
          </span>
          {searchQuery && (
            <button 
              onClick={onClearSearch}
              className="text-blue-500 hover:underline text-sm"
            >
              Очистить поиск
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default EmptyState;


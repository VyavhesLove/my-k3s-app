import { create } from 'zustand';
import api from '@/api/axios';
import { toast } from 'sonner';

export const useUserStore = create((set, get) => ({
  // === СПИСОК ПОЛЬЗОВАТЕЛЕЙ ===
  users: [],
  usersLoading: false,

  // Универсальная функция обновления списка пользователей
  refreshUsers: async (params = {}) => {
    set({ usersLoading: true });
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ usersLoading: false });
        return;
      }

      const urlParams = new URLSearchParams();
      if (params.page) urlParams.append('page', params.page);
      if (params.page_size) urlParams.append('page_size', params.page_size);
      if (params.search) urlParams.append('search', params.search);
      if (params.role && params.role.length > 0) {
        urlParams.append('role', params.role.join(','));
      }

      const response = await api.get(`/users/list/?${urlParams.toString()}`);
      
      // ✅ УНИВЕРСАЛЬНЫЙ ПАРСЕР
      let usersArray = [];
      let totalCount = 0;

      // Вариант 1: { success: true, data: { users: [...], total_count: N } }
      if (response.data?.data?.users && Array.isArray(response.data.data.users)) {
        usersArray = response.data.data.users;
        totalCount = response.data.data.total_count || 0;
      }
      // Вариант 2: { users: [...], total_count: N }
      else if (response.data?.users && Array.isArray(response.data.users)) {
        usersArray = response.data.users;
        totalCount = response.data.total_count || 0;
      }

      console.log(`✅ Загружено ${usersArray.length} пользователей`);

      set({ 
        users: usersArray,
        totalCount: totalCount,
        usersLoading: false 
      });

    } catch (err) {
      console.error('Ошибка обновления списка пользователей:', err);
      
      toast.error('❌ Не удалось загрузить список пользователей', {
        description: err.response?.status === 401 
          ? 'Сессия истекла. Войдите снова.' 
          : 'Проверьте подключение к серверу',
        duration: 5000,
      });
      
      set({ 
        users: [],
        totalCount: 0,
        usersLoading: false 
      });
    }
  },

  // Поиск пользователей
  searchUsers: async (query, pageSize = 10) => {
    set({ usersLoading: true });
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ usersLoading: false });
        return;
      }

      const params = new URLSearchParams();
      params.append('page', 1);
      params.append('page_size', pageSize);
      params.append('search', query);

      const response = await api.get(`/users/list/?${params.toString()}`);
      
      // Парсинг ответа
      let usersArray = [];
      let totalCount = 0;

      if (response.data?.data?.users && Array.isArray(response.data.data.users)) {
        usersArray = response.data.data.users;
        totalCount = response.data.data.total_count || 0;
      }
      else if (response.data?.users && Array.isArray(response.data.users)) {
        usersArray = response.data.users;
        totalCount = response.data.total_count || 0;
      }

      console.log(`🔍 Найдено ${usersArray.length} пользователей по запросу "${query}"`);

      set({ 
        users: usersArray,
        totalCount: totalCount,
        usersLoading: false 
      });

    } catch (err) {
      console.error('Ошибка поиска пользователей:', err);
      
      toast.error('❌ Не удалось выполнить поиск', {
        duration: 3000,
      });
      
      set({ 
        users: [],
        totalCount: 0,
        usersLoading: false 
      });
    }
  },

  // Точечное обновление одного пользователя в списке
  updateUserLocally: (updatedUser) => {
    const { users } = get();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      const newUsers = [...users];
      newUsers[index] = { ...newUsers[index], ...updatedUser };
      set({ users: newUsers });
    }
  },

  // Добавление нового пользователя в начало списка
  addUserToTop: (newUser) => {
    const { users } = get();
    set({ users: [newUser, ...users] });
  },

  // Удаление пользователя из списка
  removeUserFromList: (userId) => {
    const { users } = get();
    set({ users: users.filter(u => u.id !== userId) });
  },

  // === ДОПОЛНИТЕЛЬНОЕ СОСТОЯНИЕ ===
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  filters: { role: [] },

  // Методы для управления состоянием пагинации/фильтров
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilters: (filters) => set({ filters }),

  // ✅ НОВЫЙ МЕТОД: ПОЛНЫЙ СБРОС СТОРА
  reset: () => set({
    users: [],
    usersLoading: false,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    searchQuery: '',
    filters: { role: [] },
  }),
}));


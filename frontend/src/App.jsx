import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';

// Core (всегда грузится)
import { Sidebar, InventoryList, ItemCreate, Analytics, QuickActions, LoginPage, ItemDetailPanel } from '@/components/core';
import { ServiceModal, AtWorkModal, ConfirmTMCModal } from '@/components/modals';
import AppLoader from '@/components/AppLoader';
import api from '@/api/axios';
import { useItemStore } from '@/store/useItemStore';
import { useUserRoleStore } from '@/store/useUserRoleStore';

// Lazy (по требованию)
// Lazy для named exports из page modules
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ScrapPage = lazy(() => import('@/pages/ScrapPage').then((m) => ({ default: m.ScrapPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })));
const ServiceUnavailablePage = lazy(() => import('@/pages/ServiceUnavailablePage'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const UsersList_new = lazy(() => import('@/pages/UsersList/UsersList_new').then((m) => ({ default: m.default })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.default })));

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Восстанавливаем тему из localStorage или используем системную
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const { selectedItem, serviceMode, isServiceModalOpen, refreshItems } = useItemStore();
  
  // ✅ Используем Zustand store для получения роли с бэкенда
  // Это безопасный источник роли вместо localStorage
  const role = useUserRoleStore((state) => state.role);
  const isLoading = useUserRoleStore((state) => state.isLoading);
  const fetchRole = useUserRoleStore((state) => state.fetchRole);
  
  // ✅ Вычисляем isAdmin на основе роли
  const isAdmin = role === 'admin';
  
  // ✅ КРИТИЧЕСКИ ВАЖНО: Загружаем роль пользователя при наличии токена
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchRole();
    }
  }, [fetchRole]);
  
  // ✅ Состояние для AtWorkModal
  const [isAtWorkModalOpen, setIsAtWorkModalOpen] = useState(false);

  // Сохраняем тему в localStorage и применяем к body
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    document.body.className = theme + '-theme';
    document.body.style.backgroundColor = isDarkMode ? '#0f172a' : '#f9fafb';
    document.body.style.color = isDarkMode ? '#e5e7eb' : '#111827';
  }, [isDarkMode]);

  // Функция для открытия сервисной модалки
  const handleOpenServiceModal = (item, mode) => {
    if (mode === 'transfer') {
      useItemStore.getState().openTransferModal();
    } else if (mode === 'confirm') {
      // Подтверждение ТМЦ со статуса confirm -> открываем ConfirmTMCModal
      useItemStore.getState().openConfirmTMCModal();
    } else if (mode === 'service_confirm') {
      // Подтверждение ремонта / списание со статуса confirm_repair -> открываем ServiceModal
      useItemStore.getState().openServiceModal('confirm');
    } else {
      useItemStore.getState().openServiceModal(mode);
    }
  };

  // Обработчик отправки формы сервиса
  const handleServiceSubmit = async (itemId, text) => {
    try {
      const endpoint = serviceMode === 'send' ? 'send_to_service' : 'return_from_service';
      const payload = serviceMode === 'send' ? { reason: text } : { comment: text };
      
      await api.post(`/items/${itemId}/${endpoint}/`, payload);
      
      toast.success(serviceMode === 'send' ? "Отправлено в сервис" : "Принято из сервиса");
      useItemStore.getState().closeServiceModal();
    } catch (error) {
      toast.error("Ошибка при выполнении операции");
    }
  };

  // Обновляем состояние token при изменении localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    setToken(storedToken);
  }, []);

  // ✅ КРИТИЧЕСКИ ВАЖНО: Загружаем ТМЦ при наличии токена
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshItems();
    }
  }, [token, refreshItems]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : 'light'}`}>
      <Toaster 
        richColors 
        position="top-right" 
        closeButton 
        theme={isDarkMode ? 'dark' : 'light'}
      />
      
      <Suspense fallback={<AppLoader />}>
        <Routes>
        {/* Маршрут логина - доступен без токена */}
        <Route 
          path="/login" 
          element={!token ? <LoginPage setToken={setToken} isDarkMode={isDarkMode} /> : <Navigate to="/" />} 
        />

        {/* Страница неавторизованного доступа (fallback для неотловленного 401) */}
        <Route
          path="/401"
          element={<UnauthorizedPage />}
        />


        {/* Тестовые маршруты для проверки страниц ошибок (публичные) */}
        <Route path="/test/401" element={<UnauthorizedPage />} />
        <Route path="/test/403" element={<ForbiddenPage />} />
        <Route path="/test/404" element={<NotFoundPage />} />
        <Route path="/test/503" element={<ServiceUnavailablePage />} />
        
        {/* Все остальные маршруты - требуют токена */}
        <Route
          path="/*" 
          element={
            token ? (
              <div className="flex">
                <Sidebar 
                  isCollapsed={isCollapsed} 
                  setIsCollapsed={setIsCollapsed} 
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode}
                />
                <main className={`flex-1 p-6 transition-colors duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
                  {/* Все страницы получают isDarkMode как проп */}
                  <Routes>
                    <Route path="/" element={
                      <>
                      <InventoryList isDarkMode={isDarkMode} />
                      <ItemDetailPanel 
                        item={selectedItem} 
                        onClose={() => useItemStore.getState().setSelectedItem(null)} 
                        isDarkMode={isDarkMode}
                        onActionClick={handleOpenServiceModal}
                        onAtWorkClick={() => setIsAtWorkModalOpen(true)}
                      />
                        <ServiceModal 
                          isOpen={isServiceModalOpen}
                          onClose={() => useItemStore.getState().closeServiceModal()}
                          onSubmit={handleServiceSubmit}
                          item={selectedItem}
                          mode={serviceMode}
                          isDarkMode={isDarkMode}
                        />
                        <AtWorkModal 
                          isOpen={isAtWorkModalOpen}
                          onClose={() => setIsAtWorkModalOpen(false)}
                          selectedItem={selectedItem}
                          isDarkMode={isDarkMode}
                        />
                        <ConfirmTMCModal
                          isDarkMode={isDarkMode}
                        />
                      </>
                    } />
                    <Route path="/create" element={<ItemCreate isDarkMode={isDarkMode} />} />
                    <Route path="/analytics" element={<Analytics isDarkMode={isDarkMode} />} />
                    <Route path="/writeoffs" element={<ScrapPage isDarkMode={isDarkMode} />} />
                    <Route path="/profile" element={<ProfilePage isDarkMode={isDarkMode} />} />
                    
{/* Роут для админ-панели с проверкой прав (роль с бэкенда) */}
                    <Route 
                      path="/admin-panel" 
                      element={
                        isLoading ? (
                          <AppLoader />
                        ) : isAdmin ? (
                          <AdminPanel isDarkMode={isDarkMode} />
                        ) : (
                          <ForbiddenPage isDarkMode={isDarkMode} />
                        )
                      } 
                    />
                    
                    {/* Роут для списка пользователей (TanStack Table v8) */}
                    <Route 
                      path="/admin-panel/users" 
                      element={
                        isLoading ? (
                          <AppLoader />
                        ) : isAdmin ? (
                          <UsersList_new isDarkMode={isDarkMode} />
                        ) : (
                          <ForbiddenPage isDarkMode={isDarkMode} />
                        )
                      } 
                    />
                    
                    {/* Роут для страницы настроек */}
                    <Route 
                      path="/admin-panel/settings" 
                      element={
                        isLoading ? (
                          <AppLoader />
                        ) : isAdmin ? (
                          <SettingsPage isDarkMode={isDarkMode} />
                        ) : (
                          <ForbiddenPage isDarkMode={isDarkMode} />
                        )
                      } 
                    />
                    
                    <Route path="*" element={<NotFoundPage isDarkMode={isDarkMode} />} />
                  </Routes>
                </main>
                <QuickActions isDarkMode={isDarkMode} />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
      </Suspense>
    </div>
  );
}

export default App;

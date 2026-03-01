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
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(true);
  const [isMaintenanceEnabled, setIsMaintenanceEnabled] = useState(false);

  const { selectedItem, serviceMode, isServiceModalOpen, refreshItems } = useItemStore();

  const role = useUserRoleStore((state) => state.role);
  const isLoading = useUserRoleStore((state) => state.isLoading);
  const fetchRole = useUserRoleStore((state) => state.fetchRole);
  const isAdmin = role === 'admin';

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        setIsMaintenanceLoading(true);
        const response = await api.get('maintenance/public-status/');
        setIsMaintenanceEnabled(Boolean(response?.data?.enabled));
      } catch (error) {
        setIsMaintenanceEnabled(false);
      } finally {
        setIsMaintenanceLoading(false);
      }
    };

    checkMaintenance();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (token) {
      fetchRole();
    }
  }, [fetchRole, token]);

  const [isAtWorkModalOpen, setIsAtWorkModalOpen] = useState(false);

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    document.body.className = `${theme}-theme`;
    document.body.style.backgroundColor = isDarkMode ? '#0f172a' : '#f9fafb';
    document.body.style.color = isDarkMode ? '#e5e7eb' : '#111827';
  }, [isDarkMode]);

  const handleOpenServiceModal = (item, mode) => {
    if (mode === 'transfer') {
      useItemStore.getState().openTransferModal();
    } else if (mode === 'confirm') {
      useItemStore.getState().openConfirmTMCModal();
    } else if (mode === 'service_confirm') {
      useItemStore.getState().openServiceModal('confirm');
    } else {
      useItemStore.getState().openServiceModal(mode);
    }
  };

  const handleServiceSubmit = async (itemId, text) => {
    try {
      const endpoint = serviceMode === 'send' ? 'send_to_service' : 'return_from_service';
      const payload = serviceMode === 'send' ? { reason: text } : { comment: text };

      await api.post(`/items/${itemId}/${endpoint}/`, payload);

      toast.success(serviceMode === 'send' ? 'Отправлено в сервис' : 'Принято из сервиса');
      useItemStore.getState().closeServiceModal();
    } catch (error) {
      toast.error('Ошибка при выполнении операции');
    }
  };

  useEffect(() => {
    if (token && !isMaintenanceEnabled) {
      refreshItems();
    }
  }, [token, refreshItems, isMaintenanceEnabled]);

  if (isMaintenanceLoading) {
    return <AppLoader />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : 'light'}`}>
      <Toaster richColors position="top-right" closeButton theme={isDarkMode ? 'dark' : 'light'} />

      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route
            path="/login"
            element={!token ? <LoginPage setToken={setToken} isDarkMode={isDarkMode} /> : <Navigate to="/" replace />}
          />

          <Route path="/503" element={<ServiceUnavailablePage />} />
          <Route path="/401" element={<UnauthorizedPage />} />

          <Route path="/test/401" element={<UnauthorizedPage />} />
          <Route path="/test/403" element={<ForbiddenPage />} />
          <Route path="/test/404" element={<NotFoundPage />} />
          <Route path="/test/503" element={<ServiceUnavailablePage />} />

          <Route
            path="/*"
            element={
              !token ? (
                <Navigate to="/login" replace />
              ) : isMaintenanceEnabled ? (
                isLoading ? (
                  <AppLoader />
                ) : !isAdmin ? (
                  <Navigate to="/503" replace />
                ) : (
                  <Routes>
                    <Route path="/admin-panel/settings" element={<SettingsPage isDarkMode={isDarkMode} />} />
                    <Route path="/503" element={<ServiceUnavailablePage />} />
                    <Route path="*" element={<Navigate to="/admin-panel/settings" replace />} />
                  </Routes>
                )
              ) : (
                <div className="flex">
                  <Sidebar
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                  />
                  <main className={`flex-1 p-6 transition-colors duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
                    <Routes>
                      <Route
                        path="/"
                        element={
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
                            <ConfirmTMCModal isDarkMode={isDarkMode} />
                          </>
                        }
                      />
                      <Route path="/create" element={<ItemCreate isDarkMode={isDarkMode} />} />
                      <Route path="/analytics" element={<Analytics isDarkMode={isDarkMode} />} />
                      <Route path="/writeoffs" element={<ScrapPage isDarkMode={isDarkMode} />} />
                      <Route path="/profile" element={<ProfilePage isDarkMode={isDarkMode} />} />

                      <Route
                        path="/admin-panel"
                        element={
                          isLoading ? <AppLoader /> : isAdmin ? <AdminPanel isDarkMode={isDarkMode} /> : <ForbiddenPage isDarkMode={isDarkMode} />
                        }
                      />
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
              )
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;

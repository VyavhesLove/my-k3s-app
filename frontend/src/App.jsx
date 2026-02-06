import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import Sidebar from './Sidebar';
import InventoryList from './components/InventoryList';
import ItemCreate from './components/ItemCreate';
import ItemTransfer from './components/ItemTransfer';
import Analytics from './components/Analytics';
import AtWorkPage from './components/AtWorkPage';
import QuickActions from './components/QuickActions';
import LoginPage from './components/LoginPage';
import ItemDetailPanel from './components/ItemDetailPanel';
import ServiceModal from './components/modals/ServiceModal';
import api from './api/axios';
import { useItemStore } from './store/useItemStore';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const { selectedItem, serviceMode, isServiceModalOpen } = useItemStore();

  // Функция для открытия сервисной модалки
  const handleOpenServiceModal = (item, mode) => {
    useItemStore.getState().openServiceModal(mode);
  };

  // Обработчик отправки формы сервиса
  const handleServiceSubmit = async (itemId, text) => {
    try {
      const endpoint = serviceMode === 'send' ? 'send_to_service' : 'return_from_service';
      const payload = serviceMode === 'send' ? { reason: text } : { comment: text };
      
      await api.post(`/items/${itemId}/${endpoint}/`, payload);
      
      toast.success(serviceMode === 'send' ? "Отправлено в сервис" : "Принято из сервиса");
      useItemStore.getState().closeServiceModal();
      // Здесь можно добавить вызов функции обновления списка ТМЦ
    } catch (error) {
      toast.error("Ошибка при выполнении операции");
    }
  };

  // Обновляем состояние token при изменении localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    setToken(storedToken);
  }, []);

  return (
    <>
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        {/* Маршрут логина - доступен без токена */}
        <Route 
          path="/login" 
          element={!token ? <LoginPage setToken={setToken} isDarkMode={isDarkMode} /> : <Navigate to="/" />} 
        />
        
        {/* Все остальные маршруты - требуют токена */}
        <Route 
          path="/*" 
          element={
            token ? (
              <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-gray-50 text-slate-900'}`}>
                {/* Боковое меню всегда на месте */}
                <Sidebar 
                  isCollapsed={isCollapsed} 
                  setIsCollapsed={setIsCollapsed} 
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode}
                />
                
                {/* Основной контент */}
                <main className={`flex-1 transition-all duration-300 p-8 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
                  <Routes>
                    <Route path="/" element={
                      <>
                        <InventoryList isDarkMode={isDarkMode} />
                        <ItemDetailPanel 
                          item={selectedItem} 
                          onClose={() => useItemStore.getState().setSelectedItem(null)} 
                          isDarkMode={isDarkMode}
                          onActionClick={handleOpenServiceModal}
                        />
                        <ServiceModal 
                          isOpen={isServiceModalOpen}
                          onClose={() => useItemStore.getState().closeServiceModal()}
                          onSubmit={handleServiceSubmit}
                          item={selectedItem}
                          mode={serviceMode}
                          isDarkMode={isDarkMode}
                        />
                      </>
                    } />
                    <Route path="/create" element={<ItemCreate isDarkMode={isDarkMode} />} />
                    <Route path="/transfer" element={<ItemTransfer isDarkMode={isDarkMode} selectedItem={selectedItem} onTransferComplete={() => useItemStore.getState().setSelectedItem(null)} />} />
                    <Route path="/analytics" element={<Analytics isDarkMode={isDarkMode} />} />
                    <Route path="/at-work" element={<AtWorkPage isDarkMode={isDarkMode} selectedItem={selectedItem} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
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
    </>
  );
}

export default App;


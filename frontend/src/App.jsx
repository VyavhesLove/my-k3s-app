import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar';
import InventoryList from './components/InventoryList';
import ItemCreate from './components/ItemCreate';
import ItemTransfer from './components/ItemTransfer';
import Analytics from './components/Analytics';
import QuickActions from './components/QuickActions';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <Router>
      <Toaster richColors position="top-right" closeButton />
      <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-gray-50 text-slate-900'}`}>
{/* Боковое меню всегда на месте */}
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          selectedItem={selectedItem}
        />
        
        {/* Основной контент меняется в зависимости от URL */}
        <main className={`flex-1 transition-all duration-300 p-8 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <Routes>
            <Route path="/" element={<InventoryList isDarkMode={isDarkMode} selectedItem={selectedItem} onItemSelect={setSelectedItem} />} />
            <Route path="/create" element={<ItemCreate isDarkMode={isDarkMode} />} />
            <Route path="/transfer" element={<ItemTransfer isDarkMode={isDarkMode} onTransferComplete={() => setSelectedItem(null)} />} />
            <Route path="/analytics" element={<Analytics isDarkMode={isDarkMode} />} />
          </Routes>
        </main>
        <QuickActions isDarkMode={isDarkMode} />
      </div>
    </Router>
  );
}

export default App;


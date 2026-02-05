import React, { useState, useEffect } from 'react';
import { Users, PlusCircle } from 'lucide-react';
import BrigadeModal from './BrigadeModal';

const AtWorkPage = ({ isDarkMode }) => {
  const [brigades, setBrigades] = useState([]);
  const [selectedBrigade, setSelectedBrigade] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Загружаем список бригад при открытии страницы
  useEffect(() => {
    fetch('/api/brigades/')
      .then(res => res.json())
      .then(data => setBrigades(data.brigades || []));
  }, []);

  const handleSaveBrigade = async (newBrigade) => {
    try {
      const response = await fetch('/api/brigades/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBrigade)
      });

      if (response.ok) {
        const savedBrigade = await response.json();
        setBrigades(prev => [...prev, savedBrigade]);
      } else {
        console.error('Ошибка сервера:', response.status);
      }
    } catch (error) {
      console.error('Ошибка сети:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Выдача ТМЦ в работу</h1>
      
      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-gray-500">Выберите бригаду</label>
        
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={selectedBrigade}
              onChange={(e) => setSelectedBrigade(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none appearance-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <option value="">-- Не выбрана --</option>
              {brigades.map(b => <option key={b.id} value={b.id}>{b.name} ({b.brigadier})</option>)}
            </select>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium"
          >
            <PlusCircle size={20} />
            <span>Создать</span>
          </button>
        </div>
      </div>

      {/* Модалка */}
      <BrigadeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveBrigade}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default AtWorkPage;
import React, { useState, useEffect } from 'react';
import { Users, PlusCircle } from 'lucide-react';
import BrigadeModal from './BrigadeModal';
import api from '../api/axios';
import { toast } from 'sonner';

const AtWorkPage = ({ isDarkMode, selectedItem }) => {
  const [brigades, setBrigades] = useState([]);
  const [selectedBrigade, setSelectedBrigade] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState([]);

  // Загружаем список бригад при открытии страницы
  useEffect(() => {
    const fetchBrigades = async () => {
      try {
        const response = await api.get('/brigades/');
        setBrigades(response.data.brigades || []);
      } catch (err) {
        console.error('Ошибка загрузки бригад:', err);
      }
    };
    fetchBrigades();
  }, []);

  const handleSaveBrigade = async (newBrigade) => {
    try {
      const response = await api.post('/brigades/', newBrigade);
      setBrigades(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Ошибка сохранения бригады:', err);
    }
  };

  const handleIssueItem = async (itemId) => {
    if (!selectedBrigade) {
      toast.error("Сначала выберите бригаду!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Отправляем PUT запрос на обновление статуса и привязку бригады
      await api.put(`items/${selectedItem.id}/`, {
        status: 'at_work',
        brigade: selectedBrigade
      });

      toast.success("ТМЦ успешно передано в работу", {
        description: `Закреплено за бригадой ID: ${selectedBrigade}`,
      });
      
      // Обновляем локальный стейт, чтобы предмет исчез из списка "доступных"
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      toast.error("Ошибка при передаче");
      console.error(error);
    } finally {
      setIsSubmitting(false);
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

        <button 
          onClick={() => handleIssueItem(items[0]?.id)}
          disabled={isSubmitting}
          className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Передача..." : "Передать в работу"}
        </button>
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axios';
import { useItemStore } from '@/store/useItemStore';

const ItemCreate = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshItems } = useItemStore();
  
  const editItem = location.state?.editItem;
  const duplicateData = location.state?.duplicateFrom;

  const [formData, setFormData] = useState({
    name: '',
    serial: '',
    brand: '',
    noSerial: false
  });

  // Заполняем форму данными
  useEffect(() => {
    const target = editItem || duplicateData;
    if (target) {
      setFormData({
        name: target.name || '',
        brand: target.brand || '',
        serial: editItem ? (target.serial || '') : '',
        noSerial: target.serial === 'отсутствует'
      });
    }
  }, [editItem, duplicateData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация серийного номера
    if (!formData.noSerial && !formData.serial.trim()) {
      toast.warning('Заполните серийный номер или активируйте чекбокс "Серийный номер отсутствует"');
      return;
    }
    
    const isEdit = !!editItem;
    const url = isEdit ? `/items/${editItem.id}/` : '/items';

    const payload = {
      name: formData.name,
      serial: formData.noSerial ? "отсутствует" : formData.serial,
      brand: formData.brand,
    };

    // Используем toast.promise для автоматической смены состояний (загрузка -> успех/ошибка)
    toast.promise(
      isEdit ? api.put(url, payload) : api.post(url, payload),
      {
        loading: isEdit ? 'Сохранение изменений...' : 'Создание ТМЦ...',
        success: (response) => {
          // Очищаем форму при успехе
          setFormData({
            name: '',
            serial: '',
            brand: '',
            noSerial: false
          });
          
          const actionText = isEdit ? 'сохранено' : 'создано';
          
          // ✅ Обновляем список через Zustand перед переходом
          refreshItems();
          
          // Навигация после успеха
          navigate('/');
          
          return `ТМЦ "${payload.name}" успешно ${actionText}!`;
        },
        error: isEdit ? 'Не удалось сохранить изменения.' : 'Не удалось создать ТМЦ.',
      }
    );
  };

  return (
    <div className={`min-h-screen flex justify-center items-start py-16 px-6 ${isDarkMode ? 'bg-gradient-to-b from-[#0b1220] to-[#020617]' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-3xl rounded-xl p-10 shadow-2xl ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
        <h1 className={`text-3xl font-semibold mb-10 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {editItem ? 'Редактировать ТМЦ' : duplicateData ? 'Создать по аналогии' : 'Создать ТМЦ'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Наименование */}
          <div>
            <label className={`block text-sm mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Наименование *
            </label>
            <input
              type="text"
              required
              className="input-theme w-full px-4 py-3 rounded-md outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Серийный номер */}
            <div>
              <label className={`block text-sm mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Серийный номер
              </label>
              <input
                type="text"
                disabled={formData.noSerial}
                className="input-theme w-full px-4 py-3 rounded-md outline-none transition-all"
                value={formData.serial}
                onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
              />
              <label className="flex items-center gap-2 mt-3 text-sm text-gray-500 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.noSerial} 
                  onChange={(e) => setFormData({...formData, noSerial: e.target.checked, serial: ''})} 
                  className="accent-blue-500" 
                />
                Серийный номер отсутствует
              </label>
            </div>

            {/* Бренд */}
            <div>
              <label className={`block text-sm mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Бренд
              </label>
              <input
                type="text"
                className="input-theme w-full px-4 py-3 rounded-md outline-none transition-all"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
          </div>

          {/* Локация, Количество и Статус - только в форме передачи ТМЦ */}
          {/*
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>Локация</label>
              <select
                className={`w-full h-11 px-4 rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#334155] text-white' : 'bg-gray-50 text-black border border-gray-300'}`}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                <option value="">-- Выберите локацию --</option>
                {locationError ? (
                  <option disabled>Не удалось загрузить локации, попробуйте позже</option>
                ) : (
                  locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>Количество</label>
              <input
                type="number"
                disabled
                value={1}
                className={`w-full h-11 px-4 rounded-md ${isDarkMode ? 'bg-[#334155] text-white' : 'bg-gray-50 text-black border border-gray-300'}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>Статус</label>
              <select
                disabled
                className={`w-full h-11 px-4 rounded-md ${isDarkMode ? 'bg-[#334155] text-white' : 'bg-gray-50 text-black border border-gray-300'}`}
              >
                <option>Доступно</option>
              </select>
            </div>
          </div>
          */}


          <div className="flex gap-4 pt-6">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-md font-semibold transition flex items-center gap-2">
              <Save size={20} /> {editItem ? 'Сохранить' : 'Создать'}
            </button>
            <button type="button" onClick={() => navigate('/')} className={`px-8 py-3 rounded-md font-semibold transition ${isDarkMode ? 'bg-[#334155] text-white' : 'bg-gray-200 text-slate-700'}`}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemCreate;


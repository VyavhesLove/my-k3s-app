import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, ArrowLeft, MapPin, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

const ItemTransfer = ({ isDarkMode, onTransferComplete }) => {
  const navigate = useNavigate();
  const locationState = useLocation();
  const selectedItem = locationState.state?.selectedItem;

  const [locations, setLocations] = useState([]);
  const [locationWarning, setLocationWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    targetLocation: '',
    responsible: '',
  });

  // 1. Загружаем список локаций из API
  useEffect(() => {
    setLoading(true);
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        setLocations(data.locations || []);
        // Если массив пустой и это не ошибка - показываем предупреждение
        if (!data.locations || data.locations.length === 0) {
          setLocationWarning(true);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('Не удалось загрузить список локаций');
        setLoading(false);
      });

    // Если ТМЦ передан, предзаполняем ответственного
    if (selectedItem) {
      setFormData(prev => ({ ...prev, responsible: selectedItem.responsible || '' }));
    }
  }, [selectedItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const promise = fetch(`/api/items/${selectedItem.id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: formData.targetLocation,
        responsible: formData.responsible,
        status: 'issued'
      }),
    });

    toast.promise(promise, {
      loading: 'Обновление данных о местоположении...',
      success: (res) => {
        if (!res.ok) throw new Error();
        if (onTransferComplete) onTransferComplete();
        navigate('/');
        return `ТМЦ "${selectedItem.name}" успешно передано в "${formData.targetLocation}"`;
      },
      error: 'Ошибка при передаче. Попробуйте еще раз.',
    });
  };

  if (!selectedItem) {
    return (
      <div className="p-10 text-white text-center">
        <h2 className="text-2xl">ТМЦ не выбран. Вернитесь в список.</h2>
        <button onClick={() => navigate('/')} className="mt-4 bg-blue-600 px-4 py-2 rounded">Назад</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex justify-center items-start py-16 px-6 ${isDarkMode ? 'bg-gradient-to-b from-[#0b1220] to-[#020617]' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-2xl rounded-xl p-10 shadow-2xl ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
        <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Передать ТМЦ</h1>
        
        {/* Инфо о предмете */}
        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 font-semibold text-lg">{selectedItem.name}</p>
          <p className="text-gray-400 text-sm">S/N: {selectedItem.serial} | Текущая локация: {selectedItem.location || 'Не указана'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Выбор локации */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>Новая локация *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-500" size={18} />
              <select
                required
                disabled={loading}
                className={`w-full h-11 pl-10 pr-4 rounded-md outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${isDarkMode ? 'bg-[#334155] text-white' : 'bg-gray-50 text-black border border-gray-300'}`}
                value={formData.targetLocation}
                onChange={(e) => setFormData({ ...formData, targetLocation: e.target.value })}
              >
                <option value="">Выберите локацию...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            {/* Предупреждение о пустом списке локаций */}
            {locationWarning && (
              <p className="mt-2 text-sm text-amber-500 flex items-center gap-1">
                <span>⚠️</span> Список локаций пуст. Обратитесь к администратору.
              </p>
            )}
          </div>

          {/* Ответственный */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>Новый ответственный *</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="text"
                required
                placeholder="ФИО сотрудника"
                className={`w-full h-11 pl-10 pr-4 rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#334155] text-white' : 'bg-gray-50 text-black border border-gray-300'}`}
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg">
              <Send size={20} /> Подтвердить передачу
            </button>
            <button type="button" onClick={() => navigate('/')} className={`flex-1 h-12 rounded-lg font-bold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-slate-700'}`}>
              <ArrowLeft size={20} className="inline mr-2" /> Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemTransfer;
import React, { useState } from 'react';
import { X } from 'lucide-react';

const BrigadeModal = ({ isOpen, onClose, onSave, isDarkMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    brigadier: '',
    responsible: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Данные из модалки:", formData);
    onSave(formData);
    onClose();
    setFormData({ name: '', brigadier: '', responsible: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Оверлей (клик по нему закроет окно) */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Контент модалки */}
      <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl transition-all ${
        isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Новая бригада</h2>
          <button onClick={onClose} className="hover:opacity-70"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название бригады</label>
            <input 
              required
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'
              }`}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Бригадир</label>
            <input 
              required
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'
              }`}
              value={formData.brigadier}
              onChange={(e) => setFormData({...formData, brigadier: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ответственный</label>
            <input 
              required
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'
              }`}
              value={formData.responsible}
              onChange={(e) => setFormData({...formData, responsible: e.target.value})}
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4 transition-colors"
          >
            Создать бригаду
          </button>
        </form>
      </div>
    </div>
  );
};

export default BrigadeModal;
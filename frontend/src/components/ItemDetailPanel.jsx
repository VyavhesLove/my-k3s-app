import React from 'react';
import { X, History, Box, Tag } from 'lucide-react';
import { statusMap, getStatusStyles } from '../constants/statusConfig';

const ItemDetailPanel = ({ item, onClose, isDarkMode }) => {
  const isOpen = !!item;

  return (
    <div className={`fixed right-0 top-0 h-full w-[400px] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    } ${
      isDarkMode ? 'bg-slate-900 border-l border-slate-800 text-white' : 'bg-white border-l border-gray-200 text-slate-900'
    }`}>
      {/* Шапка панели — она видна всегда, но кнопки/текст внутри защитим */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center relative z-10">
        <h2 className="text-xl font-bold uppercase tracking-tight">Детали ТМЦ</h2>
        <button 
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            onClose(); 
          }} 
          className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Контент — рендерим только если есть данные, чтобы не ловить ошибки */}
      {item && (
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <div className="text-sm text-gray-500 uppercase font-semibold mb-4">Текущий статус</div>
            {/* Добавляем ? к item.status */}
            <div className={`p-4 rounded-2xl font-bold text-center uppercase tracking-wider ${getStatusStyles(item?.status, isDarkMode)}`}>
               {statusMap[item?.status] || item?.status}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4">
            <DetailRow label="Наименование" value={item?.name} />
            <DetailRow label="Серийный номер" value={item?.serial || '—'} />
            <DetailRow label="Бригада" value={item?.brigade_details?.name || 'Не закреплено'} />
          </div>

          <section>
            <div className="flex items-center gap-2 text-sm text-gray-500 uppercase font-semibold mb-4">
              <History size={16} /> Последние операции
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-500/20">
              <table className="w-full text-xs text-left">
                <thead className={isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}>
                  <tr>
                    <th className="p-2">Дата</th>
                    <th className="p-2">Операция</th>
                    <th className="p-2">Отв.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-500/10">
                  {item?.history?.map((h, i) => (
                    <tr key={i}>
                      <td className="p-2 whitespace-nowrap">{h.date}</td>
                      <td className="p-2">{h.action}</td>
                      <td className="p-2">{h.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-[10px] uppercase text-gray-500 font-bold">{label}</div>
    <div className="text-sm font-medium">{value}</div>
  </div>
);

export default ItemDetailPanel;


import React from 'react';
import { X, History } from 'lucide-react';
import { statusMap, getStatusStyles } from '../constants/statusConfig';
import TransferModal from './modals/TransferModal';
import { useItemStore } from '../store/useItemStore';

const ItemDetailPanel = ({ item, onClose, isDarkMode, onActionClick, onAtWorkClick }) => {
  const { isTransferModalOpen, closeTransferModal } = useItemStore();
  const isOpen = !!item;

  return (
    <>
      <div className={`fixed right-0 top-0 h-full w-[400px] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${
        isDarkMode ? 'bg-slate-900 border-l border-slate-800 text-white' : 'bg-white border-l border-gray-200 text-slate-900'
      }`}>
        {/* Шапка панели */}
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

        {/* Контент */}
        {item && (
          <div className="flex-1 flex flex-col min-h-0 p-6 space-y-6">
            
            {/* СТАТИЧНЫЙ БЛОК: Статус и Детали */}
            <section className="space-y-6">
              <div>
                <div className="text-sm text-gray-500 uppercase font-semibold mb-3">Текущий статус</div>
                <div className={`p-4 rounded-2xl font-bold text-center uppercase tracking-wider ${getStatusStyles(item?.status, isDarkMode)}`}>
                  {statusMap[item?.status] || item?.status}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <DetailRow label="Наименование" value={item?.name} />
                <DetailRow label="Серийный номер" value={item?.serial || '—'} />
                <DetailRow label="Бригада" value={item?.brigade_details?.name || 'Не закреплено'} />
              </div>
            </section>

            {/* Блок кнопок действий */}
            <section className="py-2">
              {/* Кнопка "В работу" - только для issued */}
              {item.status === 'issued' && (
                <button
                  onClick={onAtWorkClick}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 mb-3"
                >
                  В работу
                </button>
              )}

              {/* ТМЦ свободен или в работе -> Отправить в сервис */}
              {(item.status === 'issued' || item.status === 'at_work') && (
                <button
                  onClick={() => onActionClick(item, 'send')}
                  className={`w-full py-4 ${isDarkMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200'} rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95`}
                >
                  Отправить в сервис
                </button>
              )}

              {/* ТМЦ доступен -> Передать ТМЦ */}
              {item.status === 'available' && (
                <button
                  onClick={() => onActionClick(item, 'transfer')}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                >
                  Передать ТМЦ
                </button>
              )}

              {/* Ждет подтверждения -> Подтвердить */}
              {item.status === 'confirm_repair' && (
                <button
                  onClick={() => onActionClick(item, 'confirm')}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95"
                >
                  Подтвердить ремонт
                </button>
              )}

              {/* В ремонте -> Вернуть */}
              {(item.status === 'repair' || item.status === 'in_service') && (
                <button
                  onClick={() => onActionClick(item, 'return')}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                >
                  Принять из ремонта
                </button>
              )}

              <p className="text-[10px] text-center mt-2 opacity-50 uppercase font-bold text-gray-400">
                {item.status === 'confirm_repair' ? 'Требуется заполнение данных о ремонте' : 'Нажмите для выбора действия'}
              </p>
            </section>

            {/* СКРОЛЛИРУЕМЫЙ БЛОК: История */}
            <section className="flex-1 flex flex-col min-h-0 border-t border-gray-500/10 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 uppercase font-semibold mb-4">
                <History size={16} /> Последние операции
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-gray-500/20 custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="p-3 font-bold border-b border-gray-500/10">Дата</th>
                      <th className="p-3 font-bold border-b border-gray-500/10">Операция</th>
                      <th className="p-3 font-bold border-b border-gray-500/10">Отв.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-500/10">
                    {item?.history?.map((h, i) => (
                      <tr key={i} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}>
                        <td className="p-3 whitespace-nowrap opacity-70">{h.date}</td>
                        <td className="p-3 leading-relaxed">{h.action}</td>
                        <td className="p-3 font-medium">{h.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!item?.history || item.history.length === 0) && (
                  <div className="p-8 text-center text-gray-500 italic text-sm">
                    История операций пуста
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
      
      {/* Модалка передачи ТМЦ */}
      {isTransferModalOpen && item && (
        <TransferModal 
          isOpen={isTransferModalOpen}
          onClose={closeTransferModal}
          item={item}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-[10px] uppercase text-gray-500 font-bold">{label}</div>
    <div className="text-sm font-medium">{value}</div>
  </div>
);

export default ItemDetailPanel;



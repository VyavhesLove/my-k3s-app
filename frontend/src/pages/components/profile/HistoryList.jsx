import React from 'react';
import { History, Clock } from 'lucide-react';
import { formatDate } from '@/utils/format';

// Компонент списка истории
const HistoryList = ({ history }) => {
  return (
    <div className="bg-card rounded-lg p-6 border border-theme">
      <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
        <History size={20} />
        История последних операций
      </h2>

      {history.length === 0 ? (
        <p className="text-center py-8 opacity-60">История операций пуста</p>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-theme hover:bg-blue-500/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <History size={18} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary truncate">{item.action || 'Действие'}</p>
                {item.item_name && (
                  <p className="text-sm opacity-60">ТМЦ: {item.item_name}</p>
                )}
                <p className="text-xs opacity-40 mt-1">
                  <Clock size={12} className="inline mr-1" />
                  {formatDate(item.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryList;


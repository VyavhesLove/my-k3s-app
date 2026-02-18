import React from 'react';
import { Shield, Globe, LogOut } from 'lucide-react';
import { formatDate, getDeviceIcon } from '@/utils';

// Компонент списка сессий
const SessionsList = ({ sessions, onTerminateSession }) => {
  return (
    <div className="bg-card rounded-lg p-6 border border-theme">
      <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
        <Shield size={20} />
        Активные сессии
      </h2>
      <p className="text-sm opacity-60 mb-4">
        Управляйте устройствами, на которых выполнен вход в аккаунт
      </p>

      {sessions.length === 0 ? (
        <p className="text-center py-8 opacity-60">Нет активных сессий</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/5 border border-theme"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                {getDeviceIcon(session.user_agent)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-primary">
                    {session.description || 'Устройство'}
                  </p>
                  {session.is_current && (
                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full">
                      Текущая
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-60 flex items-center gap-1">
                  <Globe size={12} />
                  {session.ip_address || 'IP неизвестен'}
                </p>
                <p className="text-xs opacity-40 mt-1">
                  Последняя активность: {formatDate(session.last_activity)}
                </p>
              </div>
              {!session.is_current && (
                <button
                  onClick={() => onTerminateSession(session.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Завершить сессию"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsList;


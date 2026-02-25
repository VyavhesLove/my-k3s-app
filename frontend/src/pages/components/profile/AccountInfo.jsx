import React from 'react';
import { Clock, History } from 'lucide-react';
import { formatDate } from '@/utils/format';

// Компонент информации об аккаунте
const AccountInfo = ({ user }) => {
  if (!user) return null;

  return (
    <div className="mt-8 pt-6 border-t border-theme">
      <h3 className="text-md font-semibold mb-3 text-primary">Информация об аккаунте</h3>
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2 text-primary">
          <Clock size={14} className="opacity-60" />
          Дата регистрации: <span className="opacity-60">{formatDate(user.date_joined)}</span>
        </p>
        <p className="flex items-center gap-2 text-primary">
          <History size={14} className="opacity-60" />
          Последний вход: <span className="opacity-60">{formatDate(user.last_activity)}</span>
        </p>
      </div>
    </div>
  );
};

export default AccountInfo;


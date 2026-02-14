import { useState, useEffect } from 'react';
import api from '@/api/axios';

export const useSidebarStats = () => {
  const [stats, setStats] = useState({ to_receive: 0, to_repair: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/status-counters/');
        setStats({
          to_receive: response.data?.data?.to_receive || 0,
          to_repair: response.data?.data?.to_repair || 0,
        });
      } catch (error) {
        console.error('Ошибка счетчиков:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return stats;
};


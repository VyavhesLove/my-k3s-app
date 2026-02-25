import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Filter, FileText, Download } from 'lucide-react';
import api from '@/api/axios';
import { statusMap, getStatusStyles } from '@/constants/statusConfig';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Функция для получения hex-цвета статуса (не зависит от темы)
const getStatusColor = (status) => {
  const statusColors = {
    at_work: '#0ea5e9',       // sky-500 - Синий
    issued: '#0ea5e9',        // sky-500 - Синий
    available: '#10b981',      // emerald-500 - Зелёный
    in_repair: '#f43f5e',      // rose-500 - Розовый
    confirm: '#f59e0b',        // amber-500 - Янтарный
    confirm_repair: '#f59e0b', // amber-500 - Янтарный
    retired: '#64748b',       // slate-500 - Серый
  };
  return statusColors[status] || COLORS[0];
};

const Analytics = ({ isDarkMode }) => {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ name: '', brand: '', location: '' });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const query = new URLSearchParams(filters).toString();
        const url = query ? `/analytics-data?${query}` : '/analytics-data/';
        const response = await api.get(url);
        // Бэкенд возвращает { success: true, data: {...} }
        const analyticsData = response.data.data || response.data;
        console.log("Данные аналитики:", analyticsData);
        setData(analyticsData);
      } catch (err) {
        console.error("Ошибка аналитики:", err);
      }
    };
    fetchAnalytics();
  }, [filters]);

  // Трансформируем данные статусов с русскими названиями
  const statusData = useMemo(() => {
    if (!data?.by_status) return [];
    return data.by_status.map(item => ({
      ...item,
      status: statusMap[item.status] || item.status,
      originalStatus: item.status // Сохраняем оригинальный статус для определения цвета
    }));
  }, [data]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await api.post('export/', filters, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'analytics_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Ошибка экспорта:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const Card = ({ title, children, hasData }) => (
    <div className={`p-6 rounded-xl border shadow-sm ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
      <div className="h-[300px] w-full">
        {hasData ? children : (
          <div className="flex items-center justify-center h-full text-gray-500">Нет данных для отображения</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Аналитика ТМЦ</h1>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          <Download size={16} /> {isExporting ? 'Экспорт...' : 'Экспорт отчета'}
        </button>
      </div>

      {/* Панель фильтров */}
      <div className={`p-4 rounded-xl border flex flex-wrap gap-4 items-end ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase font-bold">Наименование</label>
          <input 
            className="input-theme block w-48 h-10 px-3 rounded-md border focus:outline-none"
            onChange={(e) => setFilters({...filters, name: e.target.value})}
            placeholder="Поиск..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase font-bold">Бренд</label>
          <input 
            className="input-theme block w-48 h-10 px-3 rounded-md border focus:outline-none"
            onChange={(e) => setFilters({...filters, brand: e.target.value})}
            placeholder="Все бренды"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase font-bold">Локация</label>
          <input 
            className="input-theme block w-48 h-10 px-3 rounded-md border focus:outline-none"
            onChange={(e) => setFilters({...filters, location: e.target.value})}
            placeholder="Все объекты"
          />
        </div>
      </div>

      {/* Сетка графиков */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Распределение по брендам" hasData={data && data.by_brand && data.by_brand.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data?.by_brand} dataKey="value" nameKey="brand" cx="50%" cy="50%" outerRadius={80} label>
                {data?.by_brand.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Локации (кол-во ТМЦ)" hasData={data && data.by_location && data.by_location.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.by_location}>
              <XAxis dataKey="location" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Состояние фонда" hasData={statusData && statusData.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                {statusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getStatusColor(entry.originalStatus)} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Детализация */}
      <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="p-4 border-b border-slate-700 flex items-center gap-2 font-semibold">
          <FileText size={18} className="text-blue-500" /> Детализация по выбранным фильтрам
        </div>
        <table className="w-full text-sm text-left">
          <thead className={isDarkMode ? 'bg-slate-800 text-gray-400' : 'bg-gray-50 text-gray-600'}>
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Наименование</th>
              <th className="px-4 py-3">Бренд</th>
              <th className="px-4 py-3">Локация</th>
              <th className="px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className={isDarkMode ? 'text-gray-300' : 'text-slate-700'}>
            {data?.details.map(item => (
              <tr key={item.id} className="border-t border-slate-700/50 hover:bg-blue-500/5 transition">
                <td className="px-4 py-3">#{item.id}</td>
                <td className="px-4 py-3 font-medium text-blue-400">{item.name}</td>
                <td className="px-4 py-3">{item.brand}</td>
                <td className="px-4 py-3">{item.location}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyles(item.status, isDarkMode)}`}>
                    {statusMap[item.status] || item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
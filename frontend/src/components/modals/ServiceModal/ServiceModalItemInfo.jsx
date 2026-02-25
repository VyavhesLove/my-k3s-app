// components/modals/ServiceModal/ServiceModalItemInfo.jsx
export const ServiceModalItemInfo = ({ item, isDarkMode }) => (
  <div className="overflow-hidden rounded-xl border border-gray-500/10 mb-6">
    <table className="w-full text-left">
      <thead className={isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}>
        <tr className="text-xs font-bold uppercase text-gray-500">
          <th className="px-4 py-3 w-20">Ид.</th>
          <th className="px-4 py-3">Наименование</th>
          <th className="px-4 py-3">Серийный номер</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-500/10">
        <tr>
          <td className="px-4 py-4 text-sm font-mono">{item.id}</td>
          <td className="px-4 py-4 text-sm font-medium">{item.name}</td>
          <td className="px-4 py-4 text-sm text-gray-500">{item.serial || '—'}</td>
        </tr>
      </tbody>
    </table>
  </div>
);


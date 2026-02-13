import React from 'react';
import { statusMap, getStatusStyles } from '@/constants/statusConfig';

const TableRow = ({ 
  item, 
  index, 
  isSelected, 
  isLocked, 
  lockedItems, 
  onSelect, 
  isDarkMode, 
  currentPage, 
  pageSize 
}) => {
  return (
    <tr 
      onClick={() => !isLocked && onSelect(item)}
      className={`cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-600/30 ring-1 ring-blue-500' 
          : isLocked 
            ? 'opacity-50' 
            : 'hover:bg-blue-500/5'
      } ${isLocked ? 'cursor-not-allowed' : ''}`}
      style={{ borderColor: 'var(--table-border)' }}
    >
      <td className="px-4 py-4">{(currentPage - 1) * pageSize + index + 1}</td>
      <td className="px-4 py-4 font-medium relative">
        {item.name}
        {isLocked && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 flex items-center gap-1">
            <span className="text-amber-500" title={`Заблокировано ${isLocked.user}`}>
              🔒
            </span>
          </span>
        )}
      </td>
      <td className="px-4 py-4 opacity-70">{item.serial}</td>
      <td className="px-4 py-4">{item.brand}</td>
      <td className="px-4 py-4">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${getStatusStyles(item.status, isDarkMode)}`}>
          {statusMap[item.status] || item.status}
        </span>
      </td>
      <td className="px-4 py-4 italic">{item.responsible}</td>
      <td className="px-4 py-4">{item.location}</td>
    </tr>
  );
};

export default TableRow;


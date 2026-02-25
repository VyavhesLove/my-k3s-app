import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { getRoleText } from '@/utils/role';

// Компонент для фильтрации по роли (множественный выбор)
const RoleFilter = ({ isDarkMode, filterValue, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // filterValue - массив ролей
  const selectedRoles = Array.isArray(filterValue) ? filterValue : [];
  const hasValue = selectedRoles.length > 0;

  // Закрыть dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (roleKey) => {
    let newRoles;
    if (selectedRoles.includes(roleKey)) {
      newRoles = selectedRoles.filter(r => r !== roleKey);
    } else {
      newRoles = [...selectedRoles, roleKey];
    }
    onFilterChange(newRoles);
  };

  const handleClearAll = () => {
    onFilterChange([]);
  };

  // Список ролей
  const roles = [
    { key: 'admin', label: 'Администратор' },
    { key: 'storekeeper', label: 'Кладовщик' },
    { key: 'foreman', label: 'Бригадир' },
  ];

  // Формируем текст для отображения
  const getDisplayText = () => {
    if (!hasValue) return 'Все роли';
    if (selectedRoles.length === 1) {
      return roles.find(r => r.key === selectedRoles[0])?.label || selectedRoles[0];
    }
    return `Выбрано: ${selectedRoles.length}`;
  };

  const displayText = getDisplayText();

  return (
    <div className="relative" ref={dropdownRef}>
      {hasValue && (
        <button
          onClick={handleClearAll}
          className="absolute left-2 top-1.5 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X size={14} />
        </button>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-theme py-2 pl-7 pr-8 text-xs w-full rounded outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-blue-500 text-left flex items-center justify-between"
        style={{ minWidth: '140px' }}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} className={`pointer-events-none flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isOpen ? 'rotate-180' : ''} transition-transform`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md shadow-lg border"
          style={{
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            borderColor: isDarkMode ? '#374151' : '#e5e7eb'
          }}>
          {roles.map(({ key, label }) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <div className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${
                selectedRoles.includes(key)
                  ? 'bg-blue-600 border-blue-600'
                  : isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                {selectedRoles.includes(key) && <Check size={10} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={selectedRoles.includes(key)}
                onChange={() => handleToggle(key)}
                className="sr-only"
              />
              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleFilter;


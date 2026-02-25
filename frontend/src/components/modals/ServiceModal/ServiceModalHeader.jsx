// components/modals/ServiceModal/ServiceModalHeader.jsx
import { X } from 'lucide-react';

export const ServiceModalHeader = ({ title, isLocked, onClose }) => (
  <div className="flex justify-between items-center p-6 border-b border-gray-500/10">
    <h2 className="text-xl font-bold uppercase tracking-tight">
      {title}
      {isLocked && (
        <span className="ml-2 text-xs text-green-500 font-normal">
          🔓 Заблокировано
        </span>
      )}
    </h2>
    <button 
      onClick={onClose}
      className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"
    >
      <X size={24} />
    </button>
  </div>
);


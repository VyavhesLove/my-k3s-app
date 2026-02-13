import React from 'react';
import api from '@/api/axios';

const WriteoffActions = ({ onRefresh, isCancelledView, onToggleView }) => {
    const handleToggleView = () => {
        onToggleView();
        onRefresh();
    };

    return (
        <div className="flex gap-2 mb-4">
            <button
                onClick={onRefresh}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Обновить
            </button>
            
            <button
                onClick={handleToggleView}
                className={`px-4 py-2 rounded ${
                    isCancelledView 
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
            >
                {isCancelledView ? 'Показать активные' : 'Показать отменённые'}
            </button>
        </div>
    );
};

export default WriteoffActions;


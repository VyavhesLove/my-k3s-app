// components/modals/ServiceModal/ServiceModalRepairAction.jsx
import { Controller } from 'react-hook-form';
import { Wrench, FileX } from 'lucide-react';

export const ServiceModalRepairAction = ({ 
  control, 
  watchedRepairAction, 
  isLocked, 
  isDarkMode,
  availableQty,
  errors,
  register 
}) => (
  <div className="space-y-4 mb-6">
    <label className="block text-sm font-medium uppercase tracking-wider text-gray-500">
      Выберите действие
    </label>

    <div className="grid grid-cols-2 gap-4">
      {/* В ремонт */}
      <Controller
        name="repairAction"
        control={control}
        render={({ field }) => (
          <button
            type="button"
            onClick={() => field.onChange('confirm')}
            disabled={!isLocked}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              isLocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            } ${
              field.value === 'confirm'
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-500/20 hover:border-gray-500/40'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Wrench
                size={28}
                className={field.value === 'confirm' ? 'text-green-500' : 'text-gray-400'}
              />
              <span className={`font-bold ${
                field.value === 'confirm' ? 'text-green-500' : 'text-gray-400'
              }`}>
                В ремонт
              </span>
            </div>
            {field.value === 'confirm' && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>
        )}
      />

      {/* Списать */}
      <Controller
        name="repairAction"
        control={control}
        render={({ field }) => (
          <button
            type="button"
            onClick={() => field.onChange('write_off')}
            disabled={!isLocked}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              isLocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            } ${
              field.value === 'write_off'
                ? 'border-red-500 bg-red-500/10'
                : 'border-gray-500/20 hover:border-gray-500/40'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <FileX
                size={28}
                className={field.value === 'write_off' ? 'text-red-500' : 'text-gray-400'}
              />
              <span className={`font-bold ${
                field.value === 'write_off' ? 'text-red-500' : 'text-gray-400'
              }`}>
                Списать
              </span>
            </div>
            {field.value === 'write_off' && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        )}
      />
    </div>

    {/* Поля для подтверждения ремонта */}
    {watchedRepairAction === 'confirm' && (
      <div className="space-y-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-amber-600 ml-1">Номер счета</label>
          <input 
            {...register('invoiceNumber')}
            type="text"
            className="input-theme w-full p-4 rounded-xl border outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            placeholder="Введите номер счета"
          />
          {errors.invoiceNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.invoiceNumber.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-amber-600 ml-1">Локация сервиса</label>
          <input 
            {...register('location')}
            type="text"
            className="input-theme w-full p-4 rounded-xl border outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            placeholder="Адрес/название сервиса"
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
          )}
        </div>
      </div>
    )}

    {/* Комментарий для списания */}
    {watchedRepairAction === 'write_off' && (
      <div className="space-y-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        {availableQty !== null && (
          <div className={`text-sm font-medium mb-2 ${
            availableQty < 1 ? 'text-red-500' : 'text-green-600'
          }`}>
            📦 Остаток на складе: {availableQty}
            {availableQty < 1 && ' (недостаточно!)'}
          </div>
        )}
        <label className="text-xs font-bold uppercase text-red-600 ml-1">Причина списания</label>
        <textarea 
          {...register('comment')}
          disabled={availableQty !== null && availableQty < 1}
          className={`w-full p-4 rounded-xl border outline-none transition-all resize-none ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
              : 'bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-400'
          } ${availableQty !== null && availableQty < 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          rows="3"
          placeholder="Укажите причину списания..."
        />
        {errors.comment && (
          <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>
        )}
      </div>
    )}
  </div>
);


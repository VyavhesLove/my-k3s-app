import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

/**
 * Базовый хук для создания таблицы с использованием TanStack Table v8
 * @param {Object} options - Опции таблицы
 * @param {Array} options.data - Данные таблицы
 * @param {Array} options.columns - Колонки таблицы
 * @param {Object} options.initialState - Начальное состояние (сортировка, фильтрация, пагинация)
 * @returns {Object} - Инстанс таблицы
 */
export const useTableCore = ({ data, columns, initialState = {} }) => {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState,
    // По умолчанию отключаем автоматическую сортировку
    autoSortColumn: false,
  });
};

/**
 * Утилита для создания базовых колонок
 * @param {string} accessorKey - Ключ доступа к данным
 * @param {string} header - Заголовок колонки
 * @param {Object} options - Дополнительные опции (cell, meta, etc)
 * @returns {Object} - Объект колонки
 */
export const createColumn = (accessorKey, header, options = {}) => ({
  accessorKey,
  header,
  ...options,
});

export { flexRender };
export default useReactTable;


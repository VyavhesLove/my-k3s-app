import { flexRender } from '@tanstack/react-table';

/**
 * Универсальный компонент таблицы для TanStack Table v8
 * 
 * @param {Object} props
 * @param {Object} props.table - Инстанс таблицы от useReactTable
 * @param {Object} props.styles - Кастомные стили (опционально)
 * @param {string} props.emptyMessage - Сообщение при пустых данных
 * @param {React.ReactNode} props.children - Дополнительные элементы (например, фильтры)
 */
const GenericTable = ({ table, styles = {}, emptyMessage = 'Нет данных', children }) => {
  const {
    getRowModel,
    getHeaderGroupModel,
    getState,
  } = table;

  const { sorting, columnFilters, pagination } = getState();
  const { pageSize, pageIndex } = pagination;

  // Проверка на пустые данные
  const isEmpty = getRowModel().rows.length === 0 && 
                  !columnFilters?.length && 
                  !sorting?.length;

  // Дефолтные стили
  const defaultStyles = {
    container: {
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
      border: '1px solid var(--table-border)',
      backgroundColor: 'var(--table-bg)',
      ...styles.container,
    },
    wrapper: {
      overflow: 'auto',
      maxHeight: 'calc(100vh - 280px)',
      backgroundColor: 'var(--table-bg)',
      ...styles.wrapper,
    },
    thead: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'var(--table-header-bg)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      ...styles.thead,
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '0.75rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid var(--table-border)',
      color: 'var(--table-text)',
      verticalAlign: 'middle',
      ...styles.th,
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--table-border)',
      color: 'var(--table-text)',
      fontSize: '0.875rem',
      ...styles.td,
    },
    tbody: {
      backgroundColor: 'var(--table-bg)',
      ...styles.tbody,
    },
  };

  return (
    <div style={defaultStyles.container}>
      {/* Дополнительные элементы (фильтры, поиск и т.д.) */}
      {children && <div className="p-4 border-b" style={{ borderColor: 'var(--table-border)' }}>{children}</div>}

      <div style={defaultStyles.wrapper}>
        <table style={{ width: '100%', tableLayout: 'fixed' }}>
          {/* Header Groups */}
          <thead style={defaultStyles.thead}>
            {getHeaderGroupModel().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={defaultStyles.th}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-blue-500/10' : ''}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
                          {{
                            asc: ' ▲',
                            desc: ' ▼',
                          }[header.column.getIsSorted()] ?? null}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody style={defaultStyles.tbody}>
            {isEmpty ? (
              <tr>
                <td colSpan={getHeaderGroupModel()[0]?.headers.length || 0} style={{ textAlign: 'center', padding: '48px' }}>
                  <div className="text-gray-500">
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : (
              getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ 
                    ...defaultStyles.tbody,
                    transition: 'background-color 0.15s ease',
                  }}
                  className="hover:bg-blue-500/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={defaultStyles.td}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
            
            {/* Заполнитель для пагинации (чтобы таблица не "прыгала") */}
            {!isEmpty && getRowModel().rows.length < pageSize && (
              Array.from({ length: pageSize - getRowModel().rows.length }).map((_, idx) => (
                <tr key={`spacer-${idx}`} style={{ height: '52px' }}>
                  <td colSpan={getHeaderGroupModel()[0]?.headers.length || 0} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenericTable;


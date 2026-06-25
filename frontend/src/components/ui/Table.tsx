import React from 'react'

export interface Column<T> {
  key: string
  header: React.ReactNode
  render?: (row: T, index: number) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey?: (row: T, index: number) => string | number
  onRowClick?: (row: T) => void
  empty?: React.ReactNode
  className?: string
}

const alignMap = { left: 'text-left', center: 'text-center', right: 'text-right' }

export function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  empty,
  className = '',
}: TableProps<T>) {
  return (
    <div className={`surface-card overflow-hidden ${className}`}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b surface-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-secondary ${
                    alignMap[col.align || 'left']
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-theme-muted">
                  {empty || 'No records found.'}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={rowKey ? rowKey(row, index) : index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b surface-border transition-colors last:border-0 hover:bg-[rgba(var(--surface-3-rgb),0.5)] ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 type-table ${alignMap[col.align || 'left']} ${col.className || ''}`}
                    >
                      {col.render ? col.render(row, index) : (row as Record<string, React.ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table

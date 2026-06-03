import Spinner from './Spinner'

export default function Table({ columns, data, loading, emptyText = 'No records found', onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-700">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="py-12 text-center">
              <Spinner className="mx-auto" />
            </td></tr>
          ) : !data?.length ? (
            <tr><td colSpan={columns.length} className="py-12 text-center text-surface-500">{emptyText}</td></tr>
          ) : data.map((row, i) => (
            <tr
              key={row.id ?? i}
              className={`border-b border-surface-700/50 ${onRowClick ? 'table-row-hover' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-surface-200">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

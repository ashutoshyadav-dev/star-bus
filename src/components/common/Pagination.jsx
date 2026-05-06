import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-700">
      
      {/* LEFT INFO */}
      <p className="text-xs text-surface-400">
        Page {page + 1} of {totalPages}
      </p>

      {/* RIGHT CONTROLS */}
      <div className="flex items-center gap-2">

        {/* PREV */}
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 0}
          className="p-1.5 rounded hover:bg-surface-700 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* PAGE NUMBERS */}
        <div className="flex gap-1">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`px-2 py-1 text-xs rounded ${
                i === page
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-surface-700 text-surface-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* NEXT */}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="p-1.5 rounded hover:bg-surface-700 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  )
}
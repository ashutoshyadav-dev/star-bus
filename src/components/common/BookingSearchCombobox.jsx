import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from 'react-query'
import { Search, X } from 'lucide-react'
import { bookingApi } from '../../api/booking'

/**
 * BookingSearchCombobox
 *
 * Reusable live-search combobox for admin pages.
 * Searches by passenger name or partial PNR.
 * Calls onSelect(booking) when admin picks a result.
 *
 * Props:
 *   onSelect(booking)  — called with the full booking summary object
 *   placeholder        — optional input placeholder
 *   className          — optional wrapper class
 */
export default function BookingSearchCombobox({
  onSelect,
  placeholder = 'Search by passenger name or PNR…',
  className = '',
}) {
  const [inputValue, setInputValue]   = useState('')
  const [query, setQuery]             = useState('')          // debounced
  const [open, setOpen]               = useState(false)
  const [activeIdx, setActiveIdx]     = useState(-1)

  const inputRef    = useRef(null)
  const listRef     = useRef(null)
  const debounceRef = useRef(null)
  const wrapRef     = useRef(null)

  /* ── Debounce: only fire query after 300 ms of no typing ── */
  const handleInput = useCallback((e) => {
    const val = e.target.value
    setInputValue(val)
    setActiveIdx(-1)

    clearTimeout(debounceRef.current)
    if (val.trim().length < 2) {
      setQuery('')
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      setQuery(val.trim())
      setOpen(true)
    }, 300)
  }, [])

  /* ── Fetch suggestions ── */
  const { data, isFetching } = useQuery(
    ['booking-search', query],
    () => bookingApi.adminSearch(query),
    {
      enabled: query.length >= 2,
      keepPreviousData: true,
      staleTime: 30_000,
    }
  )
      
const results = data?.data ?? []


  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Keyboard navigation ── */
  const handleKeyDown = (e) => {
    if (!open || !results.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0) selectItem(results[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  /* ── Scroll active item into view ── */
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return
    const el = listRef.current.children[activeIdx]
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  /* ── Select a result ── */
  const selectItem = (booking) => {
    setInputValue(`${booking.passengerNames?.[0] ?? ''} — ${booking.pnr}`)
    setOpen(false)
    setQuery('')
    onSelect?.(booking)
  }

  /* ── Clear ── */
  const clear = () => {
    setInputValue('')
    setQuery('')
    setOpen(false)
    setActiveIdx(-1)
    onSelect?.(null)
    inputRef.current?.focus()
  }

  const showDropdown = open && query.length >= 2
  const showClear    = inputValue.length > 0

  return (
    <div ref={wrapRef} className={`relative ${className}`}>

      {/* Input row */}
      <div
        className={`
          flex items-center gap-1
          border rounded-xl bg-white
          transition-all duration-150
          ${showDropdown ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}
        `}
      >
        <span className="pl-3 text-gray-400">
          {isFetching
            ? <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            : <Search className="w-4 h-4" />
          }
        </span>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="booking-search-listbox"
          aria-activedescendant={activeIdx >= 0 ? `bsr-item-${activeIdx}` : undefined}
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.length >= 2) setOpen(true) }}
          placeholder={placeholder}
          className="flex-1 h-10 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none font-sans"
        />

        {showClear && (
          <button
            onClick={clear}
            aria-label="Clear search"
            className="pr-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          id="booking-search-listbox"
          onMouseDown={(e) => e.preventDefault()} // prevents input blur before onClick fires
          role="listbox"
          ref={listRef}
          className="
            absolute top-[calc(100%+6px)] left-0 right-0 z-50
            bg-white border border-gray-200 rounded-xl
            overflow-hidden max-h-72 overflow-y-auto
          "
        >
          {isFetching && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-400">Searching…</li>
          )}

          {!isFetching && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-400">No bookings found</li>
          )}

          {results.length > 0 && (
            <li className="px-4 py-2 text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
              Matching bookings
            </li>
          )}

          {results.map((booking, idx) => (
            <li
              key={booking.bookingId}
              id={`bsr-item-${idx}`}
              role="option"
              aria-selected={idx === activeIdx}
              onClick={() => selectItem(booking)}
              onMouseEnter={() => setActiveIdx(idx)}
              className={`
                flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-0
                ${idx === activeIdx ? 'bg-gray-50' : 'hover:bg-gray-50'}
              `}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
                {initials(booking.passengerNames?.[0])}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {booking.passengerNames?.join(', ') ?? '—'}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {booking.pnr}
                  {booking.passengerCount > 1 && (
                    <span className="ml-2 text-gray-300">+{booking.passengerCount - 1} more</span>
                  )}
                </p>
              </div>

              {/* Amount + status */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs font-medium text-gray-700">
                  ₹{booking.totalAmountPaid?.toLocaleString('en-IN')}
                </span>
                <StatusBadge status={booking.bookingStatus} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Helpers ── */

function initials(name) {
  if (!name) return '?'
  return name.trim().split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function StatusBadge({ status }) {
  const map = {
    CONFIRMED:          'bg-green-50 text-green-800',
    PENDING_PAYMENT:    'bg-yellow-50 text-yellow-800',
    FULLY_CANCELLED:    'bg-red-50 text-red-800',
    PARTIALLY_CANCELLED:'bg-orange-50 text-orange-800',
    COMPLETED:          'bg-blue-50 text-blue-800',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}
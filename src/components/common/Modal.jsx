import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizeClass = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClass} card p-6 shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-surface-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-700 transition-colors">
            <X className="w-4 h-4 text-surface-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

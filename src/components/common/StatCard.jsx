export default function StatCard({ label, value, icon: Icon, color = 'primary', sub }) {
  const colors = {
    primary: 'text-primary-400 bg-primary-900/30',
    green:   'text-emerald-400 bg-emerald-900/30',
    red:     'text-red-400 bg-red-900/30',
    amber:   'text-amber-400 bg-amber-900/30',
    blue:    'text-blue-400 bg-blue-900/30',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-surface-400 uppercase tracking-wider font-medium">{label}</p>
          <p className="text-2xl font-semibold text-surface-100 mt-1">{value}</p>
          {sub && <p className="text-xs text-surface-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { adminWalletApi } from '../../api/wallet'
import toast from 'react-hot-toast'
import {
  Wallet, RefreshCw, Search, ArrowLeft, ShieldAlert, ShieldCheck,
  Plus, Minus, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  Receipt, AlertTriangle, BadgeCheck, RotateCcw, CreditCard,
  Banknote, X, CircleDot
} from 'lucide-react'
import { format } from 'date-fns'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmtAmt  = (v) => `₹${Number(v ?? 0).toFixed(2)}`
const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy · HH:mm') : '—'

/**
 * Jackson strips the 'is' prefix from primitive boolean fields.
 * Java: boolean isFrozen  →  JSON: { "frozen": true }   ← primitive boolean
 * Java: Boolean isFrozen  →  JSON: { "isFrozen": true }  ← boxed Boolean
 * This helper handles both so the frontend works regardless of the Java type used.
 */
const getIsFrozen = (w) => !!(w?.frozen ?? w?.isFrozen)

/* ─── Transaction type metadata ───────────────────────────────────────────── */
const TX_META = {
  TOPUP:         { label: 'Top-up',          icon: Plus,          color: 'text-emerald-600', bg: 'bg-emerald-50',  sign: '+', ringColor: 'ring-emerald-200' },
  BOOKING_DEBIT: { label: 'Booking payment', icon: CreditCard,    color: 'text-red-500',     bg: 'bg-red-50',      sign: '−', ringColor: 'ring-red-200'     },
  REFUND_CREDIT: { label: 'Refund',          icon: RotateCcw,     color: 'text-blue-600',    bg: 'bg-blue-50',     sign: '+', ringColor: 'ring-blue-200'     },
  ADMIN_CREDIT:  { label: 'Admin credit',    icon: BadgeCheck,    color: 'text-violet-600',  bg: 'bg-violet-50',   sign: '+', ringColor: 'ring-violet-200'   },
  ADMIN_DEBIT:   { label: 'Admin debit',     icon: AlertTriangle, color: 'text-orange-600',  bg: 'bg-orange-50',   sign: '−', ringColor: 'ring-orange-200'   },
  EXPIRY_DEBIT:  { label: 'Expired',         icon: AlertTriangle, color: 'text-slate-500',   bg: 'bg-slate-100',   sign: '−', ringColor: 'ring-slate-200'    },
}

const inputCls = `w-full h-10 px-3 text-sm text-slate-800 bg-white border border-slate-200
  rounded-lg outline-none transition-all
  focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300`

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
function Spin({ size = 16 }) {
  return (
    <span className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
      style={{ width: size, height: size }} />
  )
}

/* ─── Frozen Badge ────────────────────────────────────────────────────────── */
function FrozenBadge({ frozen }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
      frozen
        ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${frozen ? 'bg-red-400' : 'bg-emerald-500'}`} />
      {frozen ? 'Frozen' : 'Active'}
    </span>
  )
}

/* ─── Admin Adjust Modal ──────────────────────────────────────────────────── */
function AdjustModal({ open, mode, userId, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState('')
  const [reason,  setReason]  = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (open) { setAmount(''); setReason('') } }, [open])

  const isCredit = mode === 'credit'

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 1) { toast.error('Enter a valid amount (min ₹1)'); return }
    if (!reason.trim())  { toast.error('Reason is required');             return }
    setLoading(true)
    try {
      if (isCredit) {
        await adminWalletApi.credit(userId, { amount: amt, reason: reason.trim() })
      } else {
        await adminWalletApi.debit(userId, { amount: amt, reason: reason.trim() })
      }
      toast.success(`Wallet ${isCredit ? 'credited' : 'debited'} successfully`)
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? `Failed to ${mode} wallet`)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm ring-1 ring-slate-200/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCredit ? 'bg-emerald-50' : 'bg-orange-50'}`}>
              {isCredit
                ? <Plus className="w-4 h-4 text-emerald-600" />
                : <Minus className="w-4 h-4 text-orange-600" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {isCredit ? 'Credit wallet' : 'Debit wallet'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isCredit ? 'Add funds — creates ADMIN_CREDIT transaction' : 'Remove funds — creates ADMIN_DEBIT transaction'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Amount (₹) *</label>
            <input type="number" min="1" step="0.01" placeholder="e.g. 500"
              value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Reason / note *</label>
            <input type="text" placeholder="e.g. Compensation for delayed trip"
              value={reason} onChange={e => setReason(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className={`flex-1 h-10 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
              isCredit ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'
            }`}>
            {loading ? <Spin size={14} /> : isCredit ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            {loading ? 'Processing…' : isCredit ? 'Credit' : 'Debit'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Transaction Row ─────────────────────────────────────────────────────── */
function TxRow({ tx }) {
  const meta = TX_META[tx.transactionType] ?? TX_META.TOPUP
  const Icon = meta.icon
  const isCredit = meta.sign === '+'
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} ring-1 ${meta.ringColor}`}>
            <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">{meta.label}</p>
            {tx.description && <p className="text-xs text-slate-400 mt-0.5">{tx.description}</p>}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-400">{fmtDate(tx.createdAt)}</td>
      <td className="px-5 py-3.5 text-right">
        <span className={`text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
          {meta.sign} {fmtAmt(tx.amount)}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className="text-xs text-slate-500 font-mono">{fmtAmt(tx.balanceAfter)}</span>
      </td>
      <td className="px-5 py-3.5">
        {tx.bookingId
          ? <span className="font-mono text-[11px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{String(tx.bookingId).slice(0, 8)}…</span>
          : <span className="text-slate-300 text-xs">—</span>}
      </td>
    </tr>
  )
}

/* ─── User Wallet Detail Panel ────────────────────────────────────────────── */
function WalletDetailPanel({ userId, onBack }) {
  const [wallet,        setWallet]        = useState(null)
  const [txPage,        setTxPage]        = useState(null)
  const [page,          setPage]          = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [txLoading,     setTxLoading]     = useState(false)
  const [freezeLoading, setFreezeLoading] = useState(false)
  const [adjustMode,    setAdjustMode]    = useState(null)
  const [adjustOpen,    setAdjustOpen]    = useState(false)

  const loadWallet = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminWalletApi.getByUserId(userId)
      setWallet(res.data?.data ?? res.data)
    } catch {
      toast.error('Failed to load wallet.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadStatement = useCallback(async (p = 0) => {
    setTxLoading(true)
    try {
      const res = await adminWalletApi.getStatementByUserId(userId, { page: p, size: 20 })
      setTxPage(res.data?.data ?? res.data)
    } catch {
      toast.error('Failed to load statement.')
    } finally {
      setTxLoading(false)
    }
  }, [userId])

  useEffect(() => { loadWallet(); loadStatement(0) }, [loadWallet, loadStatement])

  /* ── FREEZE ── */
  const handleFreeze = async () => {
    if (!wallet || getIsFrozen(wallet) || freezeLoading) return
    setFreezeLoading(true)
    try {
      await adminWalletApi.freeze(userId)
      // Set BOTH field names so the UI works regardless of Jackson serialization
      setWallet(prev => ({ ...prev, frozen: true, isFrozen: true }))
      toast.success('Wallet frozen — all debits blocked.')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to freeze wallet')
    } finally {
      setFreezeLoading(false)
    }
  }

  /* ── UNFREEZE ── */
  const handleUnfreeze = async () => {
    if (!wallet || !getIsFrozen(wallet) || freezeLoading) return
    setFreezeLoading(true)
    try {
      await adminWalletApi.unfreeze(userId)
      // Set BOTH field names so the UI works regardless of Jackson serialization
      setWallet(prev => ({ ...prev, frozen: false, isFrozen: false }))
      toast.success('Wallet unfrozen — customer can now book and top up.')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to unfreeze wallet')
    } finally {
      setFreezeLoading(false)
    }
  }

  const handlePageChange = (p) => { setPage(p); loadStatement(p) }
  const openAdjust = (mode) => { setAdjustMode(mode); setAdjustOpen(true) }
  const handleAdjustSuccess = () => { loadWallet(); setPage(0); loadStatement(0) }

  const transactions = txPage?.content ?? []
  const totalPages   = txPage?.totalPages ?? 1

  // Derive frozen state once — handles both 'frozen' (primitive boolean) and 'isFrozen' (boxed Boolean)
  const isFrozen = getIsFrozen(wallet)

  return (
    <div>
      {/* Back */}
      <button type="button" onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to wallets
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">User Wallet</h2>
          <p className="font-mono text-xs text-blue-500 mt-0.5">{userId}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Refresh */}
          <button onClick={() => { loadWallet(); loadStatement(page) }} disabled={loading}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          {/* Credit */}
          <button onClick={() => openAdjust('credit')}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Credit
          </button>

          {/* Debit */}
          <button onClick={() => openAdjust('debit')}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors shadow-sm">
            <Minus className="w-3.5 h-3.5" /> Debit
          </button>

          {/* FREEZE — only enabled when wallet is NOT frozen */}
          <button
            type="button"
            onClick={handleFreeze}
            disabled={freezeLoading || loading || isFrozen}
            title={isFrozen ? 'Wallet is already frozen' : 'Freeze this wallet — blocks all debits'}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-white text-sm font-medium transition-colors shadow-sm bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500"
          >
            {freezeLoading && !isFrozen ? <Spin size={14} /> : <ShieldAlert className="w-3.5 h-3.5" />}
            Freeze
          </button>

          {/* UNFREEZE — only enabled when wallet IS frozen */}
          <button
            type="button"
            onClick={handleUnfreeze}
            disabled={freezeLoading || loading || !isFrozen}
            title={!isFrozen ? 'Wallet is not frozen' : 'Unfreeze this wallet — restores customer access'}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-white text-sm font-medium transition-colors shadow-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            {freezeLoading && isFrozen ? <Spin size={14} /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Unfreeze
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spin size={24} /></div>
      ) : wallet ? (
        <>
          {/* Frozen banner — reacts to isFrozen immediately */}
          {isFrozen && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-4">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Wallet is frozen</p>
                <p className="text-xs text-red-600/70 mt-0.5">
                  All debits (including bookings) are blocked. Click <strong>Unfreeze</strong> above to restore access.
                </p>
              </div>
              {/* Quick unfreeze directly from banner */}
              <button
                type="button"
                onClick={handleUnfreeze}
                disabled={freezeLoading}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
              >
                {freezeLoading ? <Spin size={12} /> : <ShieldCheck className="w-3 h-3" />}
                Unfreeze now
              </button>
            </div>
          )}

          {/* Wallet summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Balance',        value: fmtAmt(wallet.balance),       icon: Wallet,       accent: 'text-blue-600',    bg: 'bg-blue-50',    ring: 'ring-blue-200'    },
                { label: 'Total credited', value: fmtAmt(wallet.totalCredited), icon: TrendingUp,   accent: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
                { label: 'Total debited',  value: fmtAmt(wallet.totalDebited),  icon: TrendingDown, accent: 'text-red-500',     bg: 'bg-red-50',     ring: 'ring-red-200'     },
                { label: 'Status',         value: <FrozenBadge frozen={isFrozen} />, icon: ShieldAlert, accent: 'text-slate-500', bg: 'bg-slate-100', ring: 'ring-slate-200' },
              ].map(c => {
                const Icon = c.icon
                return (
                  <div key={c.label} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} ring-1 ${c.ring}`}>
                      <Icon className={`w-4 h-4 ${c.accent}`} />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">{c.label}</p>
                      <div className="text-base font-semibold text-slate-800 mt-0.5">{c.value}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Statement */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Transaction history</span>
              </div>
              <span className="text-xs text-slate-400">{txPage?.totalElements ?? 0} total</span>
            </div>

            {txLoading ? (
              <div className="flex justify-center items-center py-16"><Spin size={20} /></div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                <Banknote className="w-8 h-8 opacity-30" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Transaction', 'Date', 'Amount', 'Balance after', 'Booking'].map(h => (
                        <th key={h} className={`px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${h === 'Amount' || h === 'Balance after' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => <TxRow key={tx.transactionId} tx={tx} />)}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => handlePageChange(Math.max(0, page - 1))} disabled={page === 0}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Wallet className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">Wallet not found for this user</p>
        </div>
      )}

      <AdjustModal
        open={adjustOpen} mode={adjustMode} userId={userId}
        onClose={() => setAdjustOpen(false)} onSuccess={handleAdjustSuccess}
      />
    </div>
  )
}

/* ─── Wallet List Row ─────────────────────────────────────────────────────── */
function WalletRow({ wallet, onClick }) {
  return (
    <tr onClick={onClick}
      className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer transition-colors group">
      <td className="px-5 py-3.5">
        <span className="font-mono text-xs text-blue-500">{String(wallet.userId).slice(0, 8)}…</span>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-sm font-semibold text-slate-800">{fmtAmt(wallet.balance)}</span>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs text-emerald-600">{fmtAmt(wallet.totalCredited)}</span>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs text-red-500">{fmtAmt(wallet.totalDebited)}</span>
      </td>
      <td className="px-5 py-3.5"><FrozenBadge frozen={getIsFrozen(wallet)} /></td>
      <td className="px-5 py-3.5 text-xs text-slate-400">{fmtDate(wallet.updatedAt)}</td>
      <td className="px-5 py-3.5 text-slate-300 group-hover:text-slate-500 transition-colors">›</td>
    </tr>
  )
}

/* ─── Admin Wallet List Page ──────────────────────────────────────────────── */
export default function AdminWalletPage() {
  const [walletsPage, setWalletsPage] = useState(null)
  const [page,        setPage]        = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [selectedId,  setSelectedId]  = useState(null)

  useEffect(() => {
    document.title = "Wallet | APSTS Admin Portal";
  }, []);

  const loadWallets = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const res = await adminWalletApi.getAll({ page: p, size: 20 })
      setWalletsPage(res.data?.data ?? res.data)
    } catch {
      toast.error('Failed to load wallets.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadWallets(0) }, [loadWallets])

  const handlePageChange = (p) => { setPage(p); loadWallets(p) }
  const wallets    = walletsPage?.content ?? []
  const totalPages = walletsPage?.totalPages ?? 1

  const filtered = wallets.filter(w =>
    !search || String(w.userId).toLowerCase().includes(search.toLowerCase())
  )

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance ?? 0), 0)
  const frozenCount  = wallets.filter(w => getIsFrozen(w)).length
  const activeCount  = wallets.filter(w => !getIsFrozen(w)).length

  if (selectedId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <WalletDetailPanel userId={selectedId} onBack={() => setSelectedId(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Wallet management</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              View balances, credit/debit adjustments, freeze/unfreeze accounts
            </p>
          </div>
          <button onClick={() => loadWallets(page)} disabled={loading}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total wallets',   value: walletsPage?.totalElements ?? wallets.length, icon: Wallet,      accent: 'text-blue-600',    bg: 'bg-blue-50',    ring: 'ring-blue-200'    },
            { label: 'Active',          value: activeCount,                                  icon: ShieldCheck, accent: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
            { label: 'Frozen',          value: frozenCount,                                  icon: ShieldAlert, accent: 'text-red-500',     bg: 'bg-red-50',     ring: 'ring-red-200'     },
            { label: 'Balance on page', value: fmtAmt(totalBalance),                         icon: Banknote,    accent: 'text-slate-600',   bg: 'bg-slate-100',  ring: 'ring-slate-200'   },
          ].map(c => {
            const Icon = c.icon
            return (
              <div key={c.label} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} ring-1 ${c.ring}`}>
                  <Icon className={`w-5 h-5 ${c.accent}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{c.label}</p>
                  <p className="text-2xl font-semibold text-slate-800 mt-0.5">{c.value}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
              placeholder="Search by user ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20 gap-3 text-slate-400">
              <Spin size={20} /> Loading wallets…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <CircleDot className="w-8 h-8 opacity-30" />
              <p className="text-sm font-medium">No wallets found</p>
              {search && <p className="text-xs">Try a different user ID.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['User ID', 'Balance', 'Credited', 'Debited', 'Status', 'Last updated', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider last:w-8">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(w => (
                    <WalletRow key={w.walletId} wallet={w} onClick={() => setSelectedId(w.userId)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => handlePageChange(Math.max(0, page - 1))} disabled={page === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {frozenCount > 0 && (
          <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p>
              <span className="font-semibold">{frozenCount} wallet{frozenCount > 1 ? 's are' : ' is'} frozen</span> on this page.
              Customers cannot make bookings or top up. Click a wallet to unfreeze.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
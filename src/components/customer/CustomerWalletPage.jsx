import { useState, useEffect, useCallback } from 'react'
import { walletApi } from '../../api/wallet'
import toast from 'react-hot-toast'
import {
  Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw,
  CreditCard, TrendingUp, TrendingDown, AlertTriangle,
  ChevronLeft, ChevronRight, Receipt, Plus, X,
  ShieldAlert, Banknote, RotateCcw, BadgeCheck
} from 'lucide-react'
import { format } from 'date-fns'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmtAmt  = (v) => `₹${Number(v ?? 0).toFixed(2)}`
const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy · HH:mm') : '—'

/* ─── Transaction type metadata ───────────────────────────────────────────── */
const TX_META = {
  TOPUP:         { label: 'Top-up',          icon: Plus,         color: 'text-emerald-600', bg: 'bg-emerald-50',  sign: '+', ringColor: 'ring-emerald-200' },
  BOOKING_DEBIT: { label: 'Booking payment', icon: CreditCard,   color: 'text-red-500',     bg: 'bg-red-50',      sign: '−', ringColor: 'ring-red-200'     },
  REFUND_CREDIT: { label: 'Refund',          icon: RotateCcw,    color: 'text-blue-600',    bg: 'bg-blue-50',     sign: '+', ringColor: 'ring-blue-200'     },
  ADMIN_CREDIT:  { label: 'Admin credit',    icon: BadgeCheck,   color: 'text-violet-600',  bg: 'bg-violet-50',   sign: '+', ringColor: 'ring-violet-200'   },
  ADMIN_DEBIT:   { label: 'Admin debit',     icon: AlertTriangle,color: 'text-orange-600',  bg: 'bg-orange-50',   sign: '−', ringColor: 'ring-orange-200'   },
  EXPIRY_DEBIT:  { label: 'Expired',         icon: AlertTriangle,color: 'text-slate-500',   bg: 'bg-slate-100',   sign: '−', ringColor: 'ring-slate-200'    },
}

/* ─── Shared classes ──────────────────────────────────────────────────────── */
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

/* ─── Top-Up Modal ────────────────────────────────────────────────────────── */
/**
 * In production this should:
 * 1. Open a Razorpay checkout for the entered amount
 * 2. On payment success receive a gatewayPaymentId
 * 3. Call walletApi.topUp({ amount, gatewayPaymentId })
 *
 * For now the gatewayPaymentId field is manual (dev/test mode).
 */
function TopUpModal({ open, onClose, onSuccess }) {
  const [amount,    setAmount]    = useState('')
  const [gwId,      setGwId]      = useState('')
  const [loading,   setLoading]   = useState(false)

  useEffect(() => { if (open) { setAmount(''); setGwId('') } }, [open])

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 1) { toast.error('Minimum top-up is ₹1'); return }
    setLoading(true)
    try {
      await walletApi.topUp({
        amount: amt,
        gatewayPaymentId: gwId.trim() || null,
        description: 'Wallet top-up',
      })
      toast.success(`₹${amt.toFixed(2)} added to your wallet`)
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Top-up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm ring-1 ring-slate-200/60">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Add money</h2>
              <p className="text-xs text-slate-400 mt-0.5">Minimum top-up ₹1</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 250, 500, 1000].map(v => (
              <button key={v} type="button"
                onClick={() => setAmount(String(v))}
                className={`h-9 rounded-lg text-sm font-medium border transition-colors ${
                  amount === String(v)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                ₹{v}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">
              Custom amount (₹)
            </label>
            <input type="number" min="1" step="1" placeholder="e.g. 750"
              value={amount} onChange={e => setAmount(e.target.value)}
              className={inputCls} />
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">
              Gateway payment ID <span className="text-slate-400 normal-case font-normal">(from Razorpay — dev: optional)</span>
            </label>
            <input type="text" placeholder="pay_XXXXX"
              value={gwId} onChange={e => setGwId(e.target.value)}
              className={inputCls} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            {loading ? <Spin size={14} /> : <Plus className="w-4 h-4" />}
            {loading ? 'Processing…' : 'Add money'}
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
            {tx.description && (
              <p className="text-xs text-slate-400 mt-0.5">{tx.description}</p>
            )}
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

/* ─── Main Customer Wallet Page ───────────────────────────────────────────── */
export default function WalletPage() {
  const [wallet,    setWallet]    = useState(null)
  const [txPage,    setTxPage]    = useState(null)   // Page<WalletTransactionResponse>
  const [page,      setPage]      = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)

  useEffect(() => {
    document.title = "Wallet | APSTS Passenger Portal";
  }, []);

  const loadWallet = useCallback(async () => {
    setLoading(true)
    try {
      const res = await walletApi.get()
      setWallet(res.data?.data ?? res.data)
    } catch {
      toast.error('Failed to load wallet.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStatement = useCallback(async (p = 0) => {
    setTxLoading(true)
    try {
      const res = await walletApi.getStatement({ page: p, size: 15 })
      setTxPage(res.data?.data ?? res.data)
    } catch {
      toast.error('Failed to load statement.')
    } finally {
      setTxLoading(false)
    }
  }, [])

  useEffect(() => { loadWallet(); loadStatement(0) }, [loadWallet, loadStatement])

  const handlePageChange = (p) => {
    setPage(p)
    loadStatement(p)
  }

  const handleTopUpSuccess = () => {
    loadWallet()
    setPage(0)
    loadStatement(0)
  }

  const transactions = txPage?.content ?? []
  const totalPages   = txPage?.totalPages ?? 1

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">My Wallet</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage your balance and view transactions</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { loadWallet(); loadStatement(page) }} disabled={loading}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={() => setShowTopUp(true)}
              className="flex items-center gap-2 h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-emerald-200">
              <Plus className="w-4 h-4" /> Add money
            </button>
          </div>
        </div>

        {/* Balance + Stats cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spin size={24} /></div>
        ) : wallet ? (
          <>
            {/* Frozen banner */}
            {wallet.isFrozen && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-5">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Wallet frozen</p>
                  <p className="text-xs text-red-600/70 mt-0.5">
                    Your wallet has been frozen by an administrator. Payments and top-ups are disabled.
                    Please contact support.
                  </p>
                </div>
              </div>
            )}

            {/* Main balance card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available balance</span>
                  </div>
                  <p className="text-4xl font-bold text-slate-800 tracking-tight">
                    {fmtAmt(wallet.balance)}
                  </p>
                  {wallet.isFrozen && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 ring-1 ring-red-200">
                      <ShieldAlert className="w-2.5 h-2.5" /> Frozen
                    </span>
                  )}
                </div>
                <button onClick={() => setShowTopUp(true)} disabled={wallet.isFrozen}
                  className="flex items-center gap-2 h-10 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors">
                  <Plus className="w-4 h-4" /> Add money
                </button>
              </div>

              {/* Sub stats */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Total credited</p>
                    <p className="text-base font-semibold text-slate-700 mt-0.5">{fmtAmt(wallet.totalCredited)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 ring-1 ring-red-200 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Total debited</p>
                    <p className="text-base font-semibold text-slate-700 mt-0.5">{fmtAmt(wallet.totalDebited)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statement */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Transactions</span>
                </div>
                <span className="text-xs text-slate-400">{txPage?.totalElements ?? 0} total</span>
              </div>

              {txLoading ? (
                <div className="flex justify-center items-center py-16"><Spin size={20} /></div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                  <Banknote className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No transactions yet</p>
                  <p className="text-xs text-slate-400">Add money to get started.</p>
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

              {/* Pagination */}
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
            <Wallet className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Could not load wallet</p>
          </div>
        )}
      </div>

      <TopUpModal open={showTopUp} onClose={() => setShowTopUp(false)} onSuccess={handleTopUpSuccess} />
    </div>
  )
}
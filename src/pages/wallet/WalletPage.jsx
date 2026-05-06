import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { walletApi } from '../../api/booking'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'

const DEBIT_TYPES  = ['BOOKING_DEBIT','ADMIN_DEBIT','EXPIRY_DEBIT']

export default function WalletPage() {
  const qc = useQueryClient()
  const [page, setPage]       = useState(0)
  const [showTopUp, setTopUp] = useState(false)
  const [amount, setAmount]   = useState('')

  const { data: walletData }  = useQuery('wallet', walletApi.get)
  const { data: stmtData, isLoading } = useQuery(
    ['wallet-statement', page],
    () => walletApi.getStatement({ page, size: 20 }),
    { keepPreviousData: true }
  )

  const wallet     = walletData?.data?.data
  const txs        = stmtData?.data?.data?.content ?? []
  const totalPages = stmtData?.data?.data?.totalPages ?? 1

  const topUpMut = useMutation(d => walletApi.topUp(d), {
    onSuccess: () => {
      toast.success('Wallet topped up!')
      setTopUp(false)
      setAmount('')
      qc.invalidateQueries('wallet')
      qc.invalidateQueries('wallet-statement')
    }
  })

  const columns = [
    { key: 'createdAt',       label: 'Date',   render: r => <span className="font-mono text-xs text-surface-400">{r.createdAt ? format(new Date(r.createdAt), 'dd MMM HH:mm') : '—'}</span> },
    { key: 'transactionType', label: 'Type',   render: r => (
      <span className={`flex items-center gap-1 text-xs ${DEBIT_TYPES.includes(r.transactionType) ? 'text-red-400' : 'text-emerald-400'}`}>
        {DEBIT_TYPES.includes(r.transactionType)
          ? <ArrowDownLeft className="w-3 h-3" />
          : <ArrowUpRight  className="w-3 h-3" />}
        {r.transactionType?.replace(/_/g,' ')}
      </span>
    )},
    { key: 'amount',          label: 'Amount', render: r => <span className="font-mono font-medium">₹{r.amount}</span> },
    { key: 'balanceAfter',    label: 'Balance After', render: r => <span className="font-mono text-surface-400 text-xs">₹{r.balanceAfter}</span> },
    { key: 'description',     label: 'Description', render: r => <span className="text-surface-400 text-xs">{r.description ?? '—'}</span> },
  ]

  return (
    <div>
      <PageHeader title="My Wallet" subtitle="Balance and transaction history"
        actions={
          <button onClick={() => setTopUp(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Top Up
          </button>
        }
      />

      {/* Balance card */}
      {wallet && (
        <div className="card p-6 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Current Balance', `₹${wallet.balance}`,      'text-2xl font-bold text-emerald-400'],
              ['Total Credited',  `₹${wallet.totalCredited}`, 'text-lg font-semibold text-surface-200'],
              ['Total Debited',   `₹${wallet.totalDebited}`,  'text-lg font-semibold text-surface-200'],
              ['Status',          wallet.isFrozen ? 'FROZEN' : 'ACTIVE', wallet.isFrozen ? 'text-red-400' : 'text-emerald-400'],
            ].map(([k, v, cls]) => (
              <div key={k}>
                <p className="text-xs text-surface-400 mb-1">{k}</p>
                <p className={cls}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="px-4 py-3 border-b border-surface-700">
          <h2 className="text-sm font-medium text-surface-200">Transaction Statement</h2>
        </div>
        <Table columns={columns} data={txs} loading={isLoading} emptyText="No transactions yet" />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <Modal open={showTopUp} onClose={() => setTopUp(false)} title="Top Up Wallet">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Amount (₹)</label>
            <input className="input text-lg font-mono" type="number" min="1" placeholder="500"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTopUp(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => topUpMut.mutate({ amount: parseFloat(amount) })}
              disabled={topUpMut.isLoading || !amount}
              className="btn-primary flex-1 flex justify-center">
              {topUpMut.isLoading ? <Spinner size="sm" /> : `Top Up ₹${amount || 0}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

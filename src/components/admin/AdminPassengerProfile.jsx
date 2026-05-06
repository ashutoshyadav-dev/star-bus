import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { usersApi } from '../../api/users'
import Spinner from '../../components/common/Spinner'
import { format } from 'date-fns'
import {
  User, Phone, Globe, CreditCard,
  Calendar, ShieldCheck, Accessibility,
  Clock, AlertCircle
} from 'lucide-react'

/* ─── Field ────────────────────────────────────────────────────── */
function Field({ label, value, icon: Icon }) {
  return (
    <div>
      <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800">
        {value ?? '—'}
      </div>
    </div>
  )
}

/* ─── Boolean badge ─────────────────────────────────────────────── */
function BoolBadge({ value }) {
  return value
    ? <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">YES</span>
    : <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">NO</span>
}

/* ─── MAIN ──────────────────────────────────────────────────────── */
export default function AdminPassengerProfile() {
  const { id: userId } = useParams()

  const { data, isLoading, isError } = useQuery(
    ['passenger-profile', userId],
    () => usersApi.getPassengerProfile(userId),
    { enabled: !!userId }
  )

  const profile = data?.data?.data ?? data?.data ?? null

  /* loading */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size="md" />
      </div>
    )
  }

  /* error */
  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-gray-400">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm">Could not load passenger profile.</p>
      </div>
    )
  }

  /* helpers */
  const dob = profile.dateOfBirth
    ? format(new Date(profile.dateOfBirth), 'dd MMM yyyy')
    : '—'

  const updatedAt = profile.updatedAt
    ? format(new Date(profile.updatedAt), 'dd MMM yyyy, hh:mm a')
    : '—'

  const walletDisplay = profile.walletBalance != null
    ? `₹ ${Number(profile.walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    : '—'

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">
      <div className="bg-white rounded-xl shadow border border-blue-100 p-6 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">

          {/* avatar + name */}
          <div className="flex items-center gap-4">
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={profile.fullName ?? 'Profile'}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold">{profile.fullName ?? '—'}</h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{String(profile.userId ?? profile.id)}</p>
              <span className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 uppercase tracking-wide">
                Passenger
              </span>
            </div>
          </div>

          {/* stat cards — exact same style as original */}
          <div className="flex gap-3">
            <div className="bg-indigo-50 border border-blue-100 border-b-4 border-b-indigo-300 rounded-lg p-3 w-36
                            transition hover:shadow-md hover:scale-[1.02] cursor-pointer">
              <p className="text-[10px] text-gray-500">Wallet</p>
              <p className="text-lg font-semibold text-indigo-700">{walletDisplay}</p>
            </div>
            <div className="bg-emerald-50 border border-green-100 border-b-4 border-b-emerald-400 rounded-lg p-3 w-36
                            transition hover:shadow-md hover:scale-[1.02] cursor-pointer">
              <p className="text-[10px] text-gray-500">Loyalty Points</p>
              <p className="text-lg font-semibold text-emerald-700">{profile.loyaltyPoints ?? 0}</p>
            </div>
          </div>
        </div>

        {/* ── DETAILS GRID ── */}
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Full Name"       value={profile.fullName}              icon={User}          />
          <Field label="DOB"             value={dob}                           icon={Calendar}      />
          <Field label="Gender"          value={profile.gender}                icon={User}          />
          <Field label="ID Proof"        value={profile.idProofType}           icon={CreditCard}    />
          <Field label="Language"        value={profile.preferredLanguage}     icon={Globe}         />
          <Field label="Emergency Name"  value={profile.emergencyContactName}  icon={Phone}         />
          <Field label="Emergency Phone" value={profile.emergencyContactPhone} icon={Phone}         />
          <Field label="Profile ID"      value={String(profile.id)}            icon={ShieldCheck}   />
          <Field label="Updated At"      value={updatedAt}                     icon={Clock}         />

          {/* Senior Citizen — boolean badge */}
          <div>
            <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3 h-3" /> Senior Citizen
            </label>
            <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <BoolBadge value={profile.isSeniorCitizen} />
            </div>
          </div>

          {/* PWD — boolean badge */}
          <div>
            <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
              <Accessibility className="w-3 h-3" /> PWD
            </label>
            <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <BoolBadge value={profile.isPwd} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
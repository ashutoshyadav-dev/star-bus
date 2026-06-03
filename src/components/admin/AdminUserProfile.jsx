import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { usersApi } from '../../api/users'
import Spinner from '../../components/common/Spinner'
import { format } from 'date-fns'

import {
  User,
  Phone,
  Globe,
  CreditCard,
  Calendar,
  ShieldCheck,
  Accessibility,
  Clock,
  AlertCircle,
  Briefcase,
  Building2,
  Mail,
  BadgeCheck
} from 'lucide-react'

/* ───────────────── FIELD ───────────────── */
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

/* ───────────────── BOOL BADGE ───────────────── */
function BoolBadge({ value }) {
  return value ? (
    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      YES
    </span>
  ) : (
    <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      NO
    </span>
  )
}

/* ───────────────── MAIN ───────────────── */
export default function AdminUserProfile() {

  const { id: userId, type } = useParams()

  const isStaff = type?.toLowerCase() === 'staff'

  const { data, isLoading, isError } = useQuery(
    ['user-profile', userId, type],
    () =>
      isStaff
        ? usersApi.getStaffProfile(userId)
        : usersApi.getPassengerProfile(userId),
    { enabled: !!userId }
  )
  console.log("data",data);
  

  const profile = data?.data?.data ?? data?.data ?? null

  console.log("profile",profile);
  

  /* ───────────────── LOADING ───────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size="md" />
      </div>
    )
  }

  /* ───────────────── ERROR ───────────────── */
  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-gray-400">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm">
          Could not load {isStaff ? 'staff' : 'passenger'} profile.
        </p>
      </div>
    )
  }

  /* ───────────────── HELPERS ───────────────── */

  const dob = profile.dateOfBirth
    ? format(new Date(profile.dateOfBirth), 'dd MMM yyyy')
    : '—'

  const updatedAt = profile.updatedAt
    ? format(new Date(profile.updatedAt), 'dd MMM yyyy, hh:mm a')
    : '—'

  const joiningDate = profile.joiningDate
    ? format(new Date(profile.joiningDate), 'dd MMM yyyy')
    : '—'

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">

      <div className="bg-white rounded-xl shadow border border-blue-100 p-6 space-y-6">

        {/* ───────────────── HEADER ───────────────── */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">

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
              <h1 className="text-lg font-semibold">
                {profile.fullName ?? '—'}
              </h1>

              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {String(profile.userId ?? profile.id)}
              </p>

              <span className={`mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide
                ${
                  isStaff
                    ? 'bg-purple-50 text-purple-600 border-purple-100'
                    : 'bg-blue-50 text-blue-500 border-blue-100'
                }
              `}>
                {isStaff ? 'Staff' : 'Passenger'}
              </span>
            </div>
          </div>

        </div>

        {/* ───────────────── PASSENGER PROFILE ───────────────── */}
        {!isStaff && (
          <div className="grid md:grid-cols-3 gap-4">

            <Field label="Full Name" value={profile.fullName} icon={User} />

            <Field label="DOB" value={dob} icon={Calendar} />

            <Field label="Gender" value={profile.gender} icon={User} />

            <Field label="ID Proof" value={profile.idProofType} icon={CreditCard} />

            <Field label="Language" value={profile.preferredLanguage} icon={Globe} />

            <Field label="Emergency Name" value={profile.emergencyContactName} icon={Phone} />

            <Field label="Emergency Phone" value={profile.emergencyContactPhone} icon={Phone} />

            <Field label="Updated At" value={updatedAt} icon={Clock} />

            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3 h-3" />
                Senior Citizen
              </label>

              <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <BoolBadge value={profile.isSeniorCitizen} />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Accessibility className="w-3 h-3" />
                PWD
              </label>

              <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <BoolBadge value={profile.isPwd} />
              </div>
            </div>

          </div>
        )}

        {/* ───────────────── STAFF PROFILE ───────────────── */}
        {isStaff && (
          <div className="grid md:grid-cols-3 gap-4">

            <Field label="Full Name" value={profile.fullName} icon={User} />

            <Field label="Email" value={profile.email} icon={Mail} />

            <Field label="Employee Code" value={profile.employeeCode} icon={BadgeCheck} />

            <Field label="Designation" value={profile.designation} icon={Briefcase} />

            <Field label="Employment Type" value={profile.employmentType} icon={Briefcase} />

            <Field label="Depot" value={profile.depotName} icon={Building2} />

            <Field label="Joining Date" value={joiningDate} icon={Calendar} />

            <Field label="License Number" value={profile.licenseNumber} icon={CreditCard} />

            <Field
              label="License Expiry"
              value={
                profile.licenseExpiryDate
                  ? format(new Date(profile.licenseExpiryDate), 'dd MMM yyyy')
                  : '—'
              }
              icon={Calendar}
            />

            <Field label="Updated At" value={updatedAt} icon={Clock} />

          </div>
        )}

      </div>
    </div>
  )
}
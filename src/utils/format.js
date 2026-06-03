/**
 * Format Indian phone number: +919876543210 → +91 98765 43210
 */
export function formatPhone(phone) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

/**
 * Format date string to readable Indian date
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

/**
 * Format currency to INR
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style:    "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}


// utils/datetime.js
export function toOffsetDateTime(localDt) {
  if (!localDt) return null
  // localDt = "2026-05-19T13:57" from datetime-local input
  const withSeconds = localDt.length === 16 ? localDt + ':00' : localDt
  // Get local offset, e.g. "+05:30"
  const date = new Date(withSeconds)
  const off = -date.getTimezoneOffset()          // minutes
  const sign = off >= 0 ? '+' : '-'
  const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0')
  const mm = String(Math.abs(off) % 60).padStart(2, '0')
  return `${withSeconds}${sign}${hh}:${mm}`
}
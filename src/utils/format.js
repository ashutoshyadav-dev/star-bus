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

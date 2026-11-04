export const MAX_ADVANCE_DAYS = 120;           // keep equal to booking.advance-days in the backend
const pad = (n) => String(n).padStart(2, "0");

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;  // LOCAL, not UTC
export const todayISO = () => toISO(new Date());           // the old toISOString() gave yesterday in India before 05:30
export const addDaysISO = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };

export function parseISO(iso) {                              // "2026-11-03" → local Date (no UTC shift)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? "").slice(0, 10));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
}
export const isValidISO = (iso) => !!parseISO(iso);
export const isoToDMY = (iso) => { const d = parseISO(iso); return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : ""; };
export function dmyToISO(dmy) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dmy ?? ""));
  if (!m) return "";
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return isValidISO(iso) ? iso : "";
}

/** Journey date rule: valid, year 4 digits, today … today+MAX_ADVANCE_DAYS */
export function validateJourneyDate(iso) {
  if (!iso) return "Journey date is required";
  if (!isValidISO(iso)) return "Enter a valid date in DD/MM/YYYY format";
  const t = todayISO(), max = addDaysISO(t, MAX_ADVANCE_DAYS);
  if (iso < t) return "Journey date cannot be in the past";
  if (iso > max) return `Bookings are open only up to ${isoToDMY(max)}`;
  return "";
}
/** Date of birth rule */
export function validateDob(iso, { minAge = 0 } = {}) {
  if (!iso) return "Date of birth is required";
  if (!isValidISO(iso)) return "Enter a valid date in DD/MM/YYYY format";
  if (iso > todayISO()) return "Date of birth cannot be in the future";
  if (iso < "1900-01-01") return "Enter a realistic date of birth";
  if (minAge) {
    const b = parseISO(iso), t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
    if (age < minAge) return `You must be at least ${minAge} years old`;
  }
  return "";
}
// Date-time from the server (OffsetDateTime) → Indian time, one format
export const fmtDateTime = (v) => !v ? "—" : new Date(v).toLocaleString("en-IN",
  { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
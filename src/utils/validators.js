export const RE = {
  name:   /^[\p{L}][\p{L}\p{M} .'-]*$/u,
  mobile: /^[6-9]\d{9}$/,
  email:  /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/,
  digits: /^\d+$/,
};

// ── live input filters (use in onChange so the bad character never appears) ──
export const filters = {
  digits: (v, max = 99) => String(v ?? "").replace(/\D/g, "").slice(0, max),   // blocks + - e . and letters
  name:   (v, max = 100) => String(v ?? "").replace(/[^\p{L}\p{M} .'-]/gu, "").replace(/\s{2,}/g, " ").slice(0, max),
  upper:  (v, max = 20)  => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, max),
};
// block the characters type="number" lets through (+ - e E .)
export const blockNumberKeys = (e) => { if (["+", "-", "e", "E", ".", ","].includes(e.key)) e.preventDefault(); };

export const validators = {
  required: (v, label = "This field") => (String(v ?? "").trim() ? "" : `${label} is required`),

  name: (v, label = "Name") => {
    const s = String(v ?? "").trim();
    if (!s) return `${label} is required`;
    if (s.length < 2) return `${label} must be at least 2 characters`;
    if (!RE.name.test(s)) return `${label} may contain only letters, spaces, . ' and -`;
    return "";
  },

  age: (v, { min = 1, max = 120 } = {}) => {
    const s = String(v ?? "").trim();
    if (!s) return "Age is required";
    if (!RE.digits.test(s)) return "Age must be a whole number (no + or - signs)";
    const n = Number(s);
    if (n < min || n > max) return `Age must be between ${min} and ${max}`;
    return "";
  },

  mobile: (v) => {
    const s = String(v ?? "").trim();
    if (!s) return "Mobile number is required";
    if (!RE.digits.test(s)) return "Mobile number must contain digits only";
    if (s.length !== 10) return "Mobile number must be exactly 10 digits";
    if (!RE.mobile.test(s)) return "Mobile number must start with 6, 7, 8 or 9";
    return "";
  },

  email: (v, { required = true } = {}) => {
    const s = String(v ?? "").trim();
    if (!s) return required ? "Email is required" : "";
    if (s.length > 254 || s.includes("..") || !RE.email.test(s))
      return "Enter a valid email address (e.g. name@example.com)";
    return "";
  },

  otp: (v) => (/^\d{6}$/.test(String(v ?? "")) ? "" : "Enter the 6-digit OTP"),

  captcha: (v) => (String(v ?? "").length >= 4 ? "" : "Enter the captcha shown in the image"),

  gender: (v) => (v ? "" : "Select gender"),
};

/** validateAll({ name: () => validators.name(x), age: () => ... }) → { errors, ok } */
export function validateAll(rules) {
  const errors = {};
  Object.entries(rules).forEach(([k, fn]) => { const m = fn(); if (m) errors[k] = m; });
  return { errors, ok: Object.keys(errors).length === 0 };
}
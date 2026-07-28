// export const ADMIN_ROLES = ["SUPER_ADMIN", "STATE_ADMIN", "DEPOT_MANAGER", "STAFF"];

// export const ROLE_LABELS = {
//   SUPER_ADMIN:   "Super Admin",
//   STATE_ADMIN:   "State Admin",
//   DEPOT_MANAGER: "Depot Manager",
//   STAFF:         "Staff",
//   PASSENGER:     "Passenger",
// };

// export const PERMISSIONS = {
//   USER_VIEW:       "user:view",
//   USER_MANAGE:     "user:manage",
//   ROLE_MANAGE:     "role:manage",
//   AUDIT_VIEW:      "audit:view",
//   BOOKING_VIEW:    "booking:view_all",
//   PAYMENT_VIEW:    "payment:view",
//   REFUND_MANAGE:   "refund:manage",
// };

export const ADMIN_ROLES = ["SUPER_ADMIN", "STATE_ADMIN", "DEPOT_MANAGER", "STAFF"];

// ADDED — duty-staff roles that get their own area, NOT the admin panel.
// Match these against the exact Role.name values seeded in the backend's
// V1__init_user_schema.sql (currently "conductor", "driver", "guard").
export const DUTY_STAFF_ROLES = ["CONDUCTOR", "DRIVER", "GUARD", "RELIEF_DRIVER"];

export const ROLE_LABELS = {
  SUPER_ADMIN:    "Super Admin",
  STATE_ADMIN:    "State Admin",
  DEPOT_MANAGER:  "Depot Manager",
  STAFF:          "Staff",
  CONDUCTOR:      "conductor",   // ADDED
  DRIVER:         "Driver",      // ADDED
  GUARD:          "Guard",       // ADDED
  RELIEF_DRIVER:  "Relief Driver", // ADDED
  PASSENGER:      "Passenger",
};

export const PERMISSIONS = {
  USER_VIEW:       "user:view",
  USER_MANAGE:     "user:manage",
  ROLE_MANAGE:     "role:manage",
  AUDIT_VIEW:      "audit:view",
  BOOKING_VIEW:    "booking:view_all",
  PAYMENT_VIEW:    "payment:view",
  REFUND_MANAGE:   "refund:manage",
  TICKET_SCAN:     "ticket:scan",     // ADDED
  MANIFEST_VIEW:   "manifest:view",   // ADDED
};

// ADDED — single helper used everywhere instead of each file re-implementing
// `.some(r => LIST.includes(r.toUpperCase()))`
export function classifyRole(roles = []) {
  const upper = roles.map((r) => r.toUpperCase());
  if (upper.some((r) => ADMIN_ROLES.includes(r))) return "admin";
  if (upper.some((r) => DUTY_STAFF_ROLES.includes(r))) return "duty_staff";
  return "passenger";
}
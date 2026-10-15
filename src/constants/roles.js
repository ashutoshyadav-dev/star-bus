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

// Duty-staff roles that get their own area (conductor's on-bus flow), NOT the admin panel.
export const DUTY_STAFF_ROLES = ["CONDUCTOR", "DRIVER", "GUARD", "RELIEF_DRIVER"];

// Counter staff — ticket-counter booking + cash/UPI collection, its own area too.
export const COUNTER_ROLES = ["COUNTER"];

export const ROLE_LABELS = {
  SUPER_ADMIN:    "Super Admin",
  STATE_ADMIN:    "State Admin",
  DEPOT_MANAGER:  "Depot Manager",
  STAFF:          "Staff",
  CONDUCTOR:      "conductor",
  DRIVER:         "Driver",
  GUARD:          "Guard",
  RELIEF_DRIVER:  "Relief Driver",
  COUNTER:        "Counter Staff",
  PASSENGER:      "Passenger",
};

export const PERMISSIONS = {
  USER_VIEW:         "user:view",
  USER_MANAGE:       "user:manage",
  ROLE_MANAGE:       "role:manage",
  AUDIT_VIEW:        "audit:view",
  BOOKING_VIEW:      "booking:view_all",
  PAYMENT_VIEW:      "payment:view",
  REFUND_MANAGE:     "refund:manage",
  TICKET_SCAN:       "ticket:scan",
  MANIFEST_VIEW:     "manifest:view",
  BOOKING_CREATE_COUNTER:  "booking:createCounter",
  PAYMENT_COLLECT_COUNTER: "payment:collectCounter",
};

// Single helper used everywhere instead of each file re-implementing
// `.some(r => LIST.includes(r.toUpperCase()))`
export function classifyRole(roles = []) {
  const upper = roles.map((r) => r.toUpperCase());
  if (upper.some((r) => ADMIN_ROLES.includes(r))) return "admin";
  if (upper.some((r) => DUTY_STAFF_ROLES.includes(r))) return "duty_staff";
  if (upper.some((r) => COUNTER_ROLES.includes(r))) return "counter";
  return "passenger";
}

// Drivers get their own area; everyone else on duty uses the conductor area.
export const DRIVER_ROLES = ["DRIVER", "RELIEF_DRIVER"];

// Where a duty-staff user lands after login.
// A person who is a driver AND a conductor keeps the conductor screens.
export function dutyHome(roles = []) {
  const upper = roles.map((r) => r.toUpperCase());
  const isConductor = upper.some((r) => r === "CONDUCTOR" || r === "GUARD");
  const isDriver = upper.some((r) => DRIVER_ROLES.includes(r));
  return isDriver && !isConductor ? "/driver/duty" : "/conductor/duty";
}
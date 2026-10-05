import { FiHome } from "react-icons/fi";
import StaffLayoutBase from "./StaffLayoutBase";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS, DUTY_STAFF_ROLES } from "../../constants/roles";

const DUTY_NAV_ITEMS = [
  { to: "/conductor/duty", icon: <FiHome />, label: "My Duty" },
];

export default function DutyStaffLayout() {
  const { user } = useAuth();
  const upperRoles = (user?.roles ?? []).map((r) => r.toUpperCase());
  const matched = DUTY_STAFF_ROLES.find((r) => upperRoles.includes(r));
  const roleLabel = matched ? ROLE_LABELS[matched] : "Duty Staff";

  return (
    <StaffLayoutBase navItems={DUTY_NAV_ITEMS} roleLabel={roleLabel} showNotifications={false} />
  );
}
import { FiHome, FiSearch, FiCreditCard, FiClipboard } from "react-icons/fi";
import StaffLayoutBase from "./StaffLayoutBase";

const COUNTER_NAV_ITEMS = [
  { to: "/counter/dashboard",   icon: <FiHome />,       label: "Dashboard" },
  { to: "/counter/book",        icon: <FiSearch />,     label: "New Booking" },
  { to: "/counter/my-bookings", icon: <FiCreditCard />, label: "My Bookings" },
  { to: "/counter/duty",        icon: <FiClipboard />,  label: "Duty Roster" },
];

export default function CounterLayout() {
  return (
    <StaffLayoutBase navItems={COUNTER_NAV_ITEMS} roleLabel="Counter Staff" showNotifications={false} />
  );
}
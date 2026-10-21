import { FiHome, FiSearch, FiCreditCard, FiClipboard, FiAlertTriangle, FiRotateCcw, FiXCircle } from "react-icons/fi";
import StaffLayoutBase from "./StaffLayoutBase";

const COUNTER_NAV_ITEMS = [
  { to: "/counter/dashboard",            icon: <FiHome />,          label: "Dashboard" },
  { to: "/counter/book",                 icon: <FiSearch />,        label: "New Booking" },
  { to: "/counter/my-bookings",          icon: <FiCreditCard />,    label: "My Bookings" },
  { to: "/counter/duty",                 icon: <FiClipboard />,     label: "Duty Roster" },
  { to: "/counter/special-cancellation", icon: <FiAlertTriangle />, label: "Special Cancellation" },
  { to: "/counter/cancel-booking",        icon: <FiXCircle />,       label: "Cancel by PNR" },
  { to: "/counter/refunds",              icon: <FiRotateCcw />,     label: "Refunds" },
];

export default function CounterLayout() {
  return (
    <StaffLayoutBase navItems={COUNTER_NAV_ITEMS} roleLabel="Counter Staff" showNotifications={false} />
  );
}
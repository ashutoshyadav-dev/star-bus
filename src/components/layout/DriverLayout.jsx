import { FiHome } from "react-icons/fi";
import StaffLayoutBase from "./StaffLayoutBase";

const DRIVER_NAV_ITEMS = [
  { to: "/driver/duty", icon: <FiHome />, label: "My Duty" },
];

export default function DriverLayout() {
  return (
    <StaffLayoutBase navItems={DRIVER_NAV_ITEMS} roleLabel="Driver" showNotifications={false} />
  );
}
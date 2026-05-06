import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiCreditCard,
  FiSearch,
  FiUser,
  FiHeadphones
} from "react-icons/fi";

export default function Sidebar({ isOpen }) {

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 p-2 rounded transition-all duration-200 ${isActive
      ? "bg-[#FF6900] text-white"
      : "hover:bg-[#0F3D2E] border-b border-white/10 pb-2"
    }`;

  return (
    <div
      className={`h-screen fixed top-14 left-0 text-white p-5 transition-all duration-300
      bg-linear-to-b from-[#081935] via-[#0F2D2F] to-[#163F2D]
      ${isOpen ? "w-64" : "w-20"}
      `}
    >

      {/* Navigation */}
      <nav className="flex flex-col gap-4 mt-4">

        <NavLink to="/user/dashboard" className={linkClass}>
          <FiHome className="text-lg" />
          {isOpen && "Dashboard"}
        </NavLink>

        <NavLink to="/user/my-bookings" className={linkClass}>
          <FiCreditCard className="text-lg" />
          {isOpen && "My Bookings"}
        </NavLink>

        <NavLink to="/user/book-ticket" className={linkClass}>
          <FiSearch />
          {isOpen && "Book Ticket"}
        </NavLink>

        <NavLink to="/user/profile" className={linkClass}>
          <FiUser className="text-lg" />
          {isOpen && "Profile"}
        </NavLink>

        <NavLink to="/user/helpdesk" className={linkClass}>
          <FiHeadphones className="text-lg" />
          {isOpen && "Helpdesk"}
        </NavLink>

      </nav>

    </div>
  );
}
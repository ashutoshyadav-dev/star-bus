import { useState } from "react";
import { useNavigate } from "react-router-dom";
import banner from "../../assets/banner.png";
import logo   from "../../assets/logo.png";
import { FaUserCircle, FaChevronDown } from "react-icons/fa";

const MENUS = {
  about: [
    { name: "Our History",       path: "/our-history" },
    { name: "Bus Routes",        path: "/routes" },
    { name: "Our Bus Services",  path: "/buses" },
    { name: "RTI",               path: "/rti" },
    { name: "Policies",          path: "/policies" },
    { name: "Tenders",           path: "/tenders" },
  ],
  query: [
    { name: "Timetable",   path: "/timetable" },
    { name: "Help Desk",   path: "/helpdesk" },
    { name: "Contact Us",  path: "/contact" },
    { name: "FAQs",        path: "/faq" },
  ],
  services: [
    { name: "Book Ticket",          path: "/user/book-ticket" },
    { name: "My Bookings",          path: "/user/my-bookings" },
    { name: "Cancel Ticket",        path: "/user/my-bookings" },
    { name: "Download e-Ticket",    path: "/user/my-bookings" },
  ],
  login: [
    { name: "Passenger Login", path: "/login" },
    { name: "Staff / Admin Login", path: "/login" },
  ],
};

function Dropdown({ label, menuKey, openMenu, setOpenMenu, navigate }) {
  const items = MENUS[menuKey];
  return (
    <div
      className="relative pt-2"
      onMouseEnter={() => setOpenMenu(menuKey)}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="flex items-center gap-1 cursor-pointer hover:text-orange-400 select-none">
        {label} <FaChevronDown size={11} />
      </div>
      {openMenu === menuKey && (
        <div className="absolute top-full left-0 w-52 rounded-xl py-2 shadow-2xl bg-gradient-to-br from-[#0a2540] to-[#14532d] z-[999] border border-white/10">
          {items.map((item) => (
            <p
              key={item.name}
              onClick={() => { navigate(item.path); setOpenMenu(null); }}
              className="px-4 py-2.5 text-sm rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
            >
              {item.name}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="absolute top-0 left-0 w-full z-[999]">
      {/* Banner background */}
      <div
        className="absolute inset-0 w-full h-full bg-center bg-cover pointer-events-none"
        style={{ backgroundImage: `url(${banner})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a2540]/92 via-[#0f3d3e]/85 to-[#14532d]/92 pointer-events-none" />

      <div className="relative flex items-center justify-between px-8 py-4 text-white">
        {/* Logo + name */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} className="w-9 h-9 rounded-full object-cover border border-white/30" alt="APSTS" />
          <div>
            <p className="text-[13px] font-semibold leading-tight">
              Arunachal Pradesh State Transport Services
            </p>
            <p className="text-[10px] opacity-70">Version 4.0</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-8 text-sm">
          <span onClick={() => navigate("/")} className="cursor-pointer hover:text-orange-400 transition-colors">
            Home
          </span>
          <Dropdown label="About Us"       menuKey="about"    openMenu={openMenu} setOpenMenu={setOpenMenu} navigate={navigate} />
          <Dropdown label="Any Query"      menuKey="query"    openMenu={openMenu} setOpenMenu={setOpenMenu} navigate={navigate} />
          <Dropdown label="Online Services" menuKey="services" openMenu={openMenu} setOpenMenu={setOpenMenu} navigate={navigate} />
        </div>

        {/* Login dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu("login")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
            <FaUserCircle size={17} />
            <span className="text-sm">Login</span>
            <FaChevronDown size={11} />
          </div>
          {openMenu === "login" && (
            <div className="absolute top-full right-0 mt-1 w-48 rounded-xl py-2 shadow-2xl bg-gradient-to-br from-[#0a2540] to-[#14532d] z-[9999] border border-white/10">
              {MENUS.login.map((item) => (
                <p
                  key={item.name}
                  onClick={() => { navigate(item.path); setOpenMenu(null); }}
                  className="px-4 py-2.5 text-sm cursor-pointer hover:bg-white/10 transition-colors"
                >
                  {item.name}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

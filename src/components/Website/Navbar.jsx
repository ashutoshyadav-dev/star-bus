import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import banner from "../../assets/banner.png";
import logo from "../../assets/logo.png";
import Logo from "../../assets/logo2.jpeg"


import { FaChevronDown, FaUserCircle } from "react-icons/fa";

const MENUS = {
  about: [
    { name: "Our History", path: "/ap/our-history" },
    { name: "Bus Routes", path: "/ap/routes" },
    { name: "Our Bus Services", path: "/ap/buses" },
    { name: "RTI", path: "/ap/rti" },

    { name: "Policies", path: "/ap/policies" },
    { name: "Tenders", path: "/ap/tenders" },
  ],

  query: [
    { name: "Timetable", path: "/ap/timetable" },
    { name: "Help Desk", path: "/ap/helpdesk" },
    { name: "Contact Us", path: "/ap/contact" },
    { name: "FAQs", path: "/ap/faq" },
    { name: "Policies", path: "/ap/Cancellation-Policy" },
    { name: "Tender", path: "/ap/tender" },
  ],

  


  services: [
    { name: "Book Ticket", path: "/user/book-ticket" },
    { name: "My Bookings", path: "/user/my-bookings" },
    { name: "Cancel Ticket", path: "/user/my-bookings" },
    { name: "Download e-Ticket", path: "/user/my-bookings" },
  ],

  login: [
    { name: "Passenger Login", path: "/ap/login" },
    { name: "Staff / Admin Login", path: "/ap/login?mode=staff" },
  ],
};

function Dropdown({
  label,
  menuKey,
  openMenu,
  setOpenMenu,
  width = "w-56",
}) {
  const items = MENUS[menuKey];

  return (
    <div
      className="relative h-full flex items-center"
      onMouseEnter={() => setOpenMenu(menuKey)}
      onMouseLeave={() => setOpenMenu(null)}
    >

      <div
        className="
          h-full flex items-center
          gap-1 cursor-pointer
          text-[14px] font-medium
          hover:text-orange-300
          transition-all duration-200
          select-none
        "
      >
        {label}
        <FaChevronDown size={10} className="mt-[1px]" />
      </div>


      {/* DROPDOWN */}
      {openMenu === menuKey && (
        <div
          className={`
            absolute top-full left-0
            pt-2
            ${width}
            z-[9999]
          `}
        >
          <div
            className="

              rounded-xl overflow-hidden
              backdrop-blur-xl
              bg-[#0b1f2c]/95
              border border-white/10
              shadow-[0_10px_40px_rgba(0,0,0,0.45)]

            "
          >

            <div className="py-2">
              {items.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setOpenMenu(null)}
                  className="
                    block
                    px-4 py-3
                    text-[13px]
                    text-white/90
                    cursor-pointer
                    transition-all duration-200
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
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

      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: `url(${banner})`,
        }}
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#072235]/90 via-[#0b3240]/80 to-[#0d4a2f]/85 backdrop-blur-[2px]" />

      {/* NAVBAR */}
      <div
        className="
          relative flex items-center justify-between
          px-10 lg:px-12
          h-[64px]
          text-white
          border-b border-white/10
        "
      >

        {/* LEFT LOGO */}
        <div
          onClick={() => navigate("/ap")}
          className="flex items-center gap-3 cursor-pointer min-w-fit"
        >
          <img
            src={logo}
            alt="APSTS"

            className="
              w-9 h-9 rounded-full object-cover
              border border-white/30
              shadow-md
            "

          />

          <div className="leading-tight">
            <p className="text-[14px] font-semibold tracking-wide">
              Arunachal Pradesh State Transport Services
            </p>


            <p className="text-[11px] text-white/70">
              Version 4.0
            </p>

          </div>
        </div>

        {/* CENTER NAV */}
        <div className="flex items-center gap-10 text-white h-full">

          {/* HOME */}
          <span
            onClick={() => navigate("/ap")}
            className="
              h-full flex items-center
              cursor-pointer
              text-[14px]
              font-medium
              hover:text-orange-300
              transition-all duration-200
            "
          >
            Home 
          </span>

          {/* ABOUT */}
          <Dropdown
            label="About Us"
            menuKey="about"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            width="w-56"
          />

          {/* QUERY */}
          <Dropdown
            label="Any Query"
            menuKey="query"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            width="w-48"
          />

          {/* SERVICES */}
          <Dropdown
            label="Online Services"
            menuKey="services"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            width="w-56"
          />
        </div>

        {/* LOGIN */}
        <div
          className="relative h-full flex items-center"
          onMouseEnter={() => setOpenMenu("login")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          {/* LOGIN BUTTON */}
          <div

            className="
              flex items-center gap-2
              px-5 py-2
              rounded-full
              cursor-pointer
              text-[14px]
              font-medium
              bg-white/10
              border border-white/10
              backdrop-blur-md
              hover:bg-white/20
              transition-all duration-200
            "
          >
            <FaUserCircle size={16} />
            <span>Login</span>
            <FaChevronDown size={10} />
          </div>

          {/* LOGIN DROPDOWN */}
          {openMenu === "login" && (
            <div
              className="
                absolute top-full right-0
                pt-2
                w-52
                z-[9999]
              "
            >
              <div
                className="
                  rounded-xl overflow-hidden
                  bg-[#0b1f2c]/95
                  backdrop-blur-xl
                  border border-white/10
                  shadow-[0_10px_40px_rgba(0,0,0,0.45)]
                "
              >

                <div className="py-2">
                  {MENUS.login.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setOpenMenu(null)}

                      className="
                        block
                        px-4 py-3
                        text-[13px]
                        text-white/90
                        cursor-pointer
                        transition-all duration-200
                        hover:bg-white/10
                        hover:text-white
                      "

                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
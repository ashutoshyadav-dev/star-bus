import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cmsApi } from "../../api/cms";

import banner from "../../assets/banner.png";
import logo from "../../assets/logo.png";
import Logo from "../../assets/logo2.jpeg";
import { FaChevronDown, FaUserCircle, FaBars, FaTimes } from "react-icons/fa";


// ================= DROPDOWN =================

function Dropdown({
  label,
  menuKey,
  openMenu,
  setOpenMenu,
  width = "w-56",
  items = [],
}) {
  return (
    <div
      className="relative flex items-center h-full"
      onMouseEnter={() => setOpenMenu(menuKey)}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="flex items-center h-full gap-1 text-sm font-medium transition-all duration-200 cursor-pointer select-none hover:text-orange-300">
        {label}
        <FaChevronDown size={10} className="mt-[1px]" />
      </div>

      {openMenu === menuKey && (
        <div className={`absolute top-full left-0 pt-2 ${width} z-[9999]`}>
          <div className="overflow-hidden border rounded-xl backdrop-blur-xl bg-[#0b1f2c]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
            <div className="py-2">
              {items.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  target={item.openInNewTab ? "_blank" : "_self"}
                  rel="noreferrer"
                  onClick={() => setOpenMenu(null)}
                  className="block px-4 py-3 text-[13px] text-white/90 cursor-pointer transition-all duration-200 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ================= NAVBAR =================

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [menus, setMenus] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    cmsApi
      .getActiveMenus()
      .then((res) => setMenus(res.data?.data ?? res.data ?? []))
      .catch(console.error);
  }, []);

  const menuFor = (position) =>
    menus.filter((m) => m.position === position);

  const closeMobileMenu = () => {
    setMobileMenu(false);
    setOpenMenu(null);
  };

  return (
    <div className="absolute top-0 left-0 z-[999] w-full max-w-full overflow-visible">

      {/* ================= BACKGROUND ================= */}

      <div
        className="absolute inset-0 bg-center bg-cover pointer-events-none"
        style={{ backgroundImage: `url(${banner})` }}
      />

      {/* ================= OVERLAY ================= */}

      <div className="absolute inset-0 bg-gradient-to-r from-[#072235]/90 via-[#0b3240]/80 to-[#0d4a2f]/85 backdrop-blur-[2px]" />


      {/* ================= NAVBAR ================= */}

      <div
        className="
          relative
          flex
          items-center
          justify-between

          w-full
          max-w-full

          h-[64px]

          px-3
          sm:px-5
          md:px-6
          lg:px-12

          text-white
          border-b
          border-white/10
        "
      >

        {/* ================= LEFT LOGO ================= */}

        <div
          onClick={() => {
            navigate("/home");
            closeMobileMenu();
          }}
          className="flex items-center flex-shrink min-w-0 gap-2 cursor-pointer  sm:gap-3"
        >

          <img
            src={logo}
            alt="APSTS"
            className="flex-shrink-0 object-cover w-8 h-8 border rounded-full shadow-md  sm:w-9 sm:h-9 border-white/30"
          />

          <div className="min-w-0 leading-tight">

            <p
              className="
                text-[9px]
                sm:text-[11px]
                md:text-[12px]
                lg:text-[14px]

                font-semibold
                tracking-wide

                truncate
                max-w-[150px]
                sm:max-w-[220px]
                md:max-w-[300px]
                lg:max-w-none
              "
            >
              Arunachal Pradesh State Transport Services
            </p>

            <p
              className="
                text-[8px]
                sm:text-[9px]
                md:text-[10px]
                lg:text-[11px]

                text-white/70
              "
            >
              Version 4.0
            </p>

          </div>
        </div>


        {/* ================= DESKTOP CENTER NAV ================= */}

        <div
          className="items-center justify-center hidden h-full gap-6 text-white  lg:flex xl:gap-10"
        >

          {/* HOME */}

          <span
            onClick={() => navigate("/home")}
            className="flex items-center h-full text-sm font-medium transition-all duration-200 cursor-pointer  hover:text-orange-300"
          >
            Home
          </span>


          {/* ABOUT */}

          <Dropdown
            label="About Us"
            menuKey="ABOUT"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            width="w-56"
            items={menuFor("ABOUT")}
          />


          {/* QUERY */}

          <Dropdown
            label="Any Query"
            menuKey="QUERY"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            width="w-48"
            items={menuFor("QUERY")}
          />


          {/* SERVICES */}

          <Dropdown
            label="Online Services"
            menuKey="SERVICES"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            width="w-56"
            items={menuFor("SERVICES")}
          />

        </div>


        {/* ================= DESKTOP LOGIN ================= */}

        <div
          className="relative items-center flex-shrink-0 hidden h-full  lg:flex"
          onMouseEnter={() => setOpenMenu("LOGIN")}
          onMouseLeave={() => setOpenMenu(null)}
        >

          {/* LOGIN BUTTON */}

          <div
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 border rounded-full cursor-pointer  xl:px-5 bg-white/10 border-white/10 backdrop-blur-md hover:bg-white/20"
          >
            <FaUserCircle size={16} />

            <span>Login</span>

            <FaChevronDown size={10} />
          </div>


          {/* LOGIN DROPDOWN */}

          {openMenu === "LOGIN" && (
            <div className="absolute right-0 z-[9999] w-52 pt-2 top-full">

              <div
                className="
                  overflow-hidden

                  rounded-xl

                  bg-[#0b1f2c]/95

                  backdrop-blur-xl

                  border
                  border-white/10

                  shadow-[0_10px_40px_rgba(0,0,0,0.45)]
                "
              >

                <div className="py-2">

                  {menuFor("LOGIN").map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setOpenMenu(null)}
                      className="
                        block

                        px-4
                        py-3

                        text-[13px]
                        text-white/90

                        cursor-pointer

                        transition-all
                        duration-200

                        hover:bg-white/10
                        hover:text-white
                      "
                    >
                      {item.label}
                    </Link>
                  ))}

                </div>

              </div>

            </div>
          )}


          {/* AP LOGO */}

          <div className="flex items-center justify-center ml-2">

            <div
              className="flex items-center justify-center w-10 h-10 bg-white border-2 border-white rounded-full shadow-lg  xl:w-12 xl:h-12"
            >

              <img
                src={Logo}
                alt="AP Logo"
                className="object-contain w-8 h-8  xl:w-10 xl:h-10"
              />

            </div>

          </div>

        </div>


        {/* ================= MOBILE RIGHT SIDE ================= */}

        <div
          className="flex items-center flex-shrink-0 gap-2  lg:hidden"
        >

          {/* AP LOGO */}

          <div
            className="flex items-center justify-center bg-white border border-white rounded-full shadow-lg  w-9 h-9 sm:w-10 sm:h-10"
          >

            <img
              src={Logo}
              alt="AP Logo"
              className="object-contain  w-7 h-7 sm:w-8 sm:h-8"
            />

          </div>


          {/* HAMBURGER */}

          <button
            onClick={() => setMobileMenu((prev) => !prev)}
            className="flex items-center justify-center transition-all border rounded-lg  w-9 h-9 sm:w-10 sm:h-10 bg-white/10 border-white/10 hover:bg-white/20"
            aria-label="Toggle menu"
          >

            {mobileMenu ? (
              <FaTimes size={18} />
            ) : (
              <FaBars size={18} />
            )}

          </button>

        </div>

      </div>


      {/* ================= MOBILE MENU ================= */}

      {mobileMenu && (
        <div
          className="
            relative
            lg:hidden

            w-full

            border-t
            border-white/10

            bg-[#0b1f2c]/95

            backdrop-blur-xl

            shadow-xl
          "
        >

          <div className="px-4 py-3 space-y-1">

            {/* HOME */}

            <button
              onClick={() => {
                navigate("/home");
                closeMobileMenu();
              }}
              className="w-full px-3 py-3 text-sm text-left text-white rounded-lg  hover:bg-white/10"
            >
              Home
            </button>


            {/* ABOUT */}

            <button
              onClick={() =>
                setOpenMenu(openMenu === "ABOUT" ? null : "ABOUT")
              }
              className="flex items-center justify-between w-full px-3 py-3 text-sm text-white rounded-lg  hover:bg-white/10"
            >
              <span>About Us</span>
              <FaChevronDown size={10} />
            </button>

            {openMenu === "ABOUT" && (
              <div className="pl-3">

                {menuFor("ABOUT").map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    target={item.openInNewTab ? "_blank" : "_self"}
                    rel="noreferrer"
                    onClick={closeMobileMenu}
                    className="
                      block

                      px-3
                      py-2.5

                      text-sm
                      text-white/80

                      rounded-lg

                      hover:bg-white/10
                      hover:text-white
                    "
                  >
                    {item.label}
                  </Link>
                ))}

              </div>
            )}


            {/* ANY QUERY */}

            <button
              onClick={() =>
                setOpenMenu(openMenu === "QUERY" ? null : "QUERY")
              }
              className="flex items-center justify-between w-full px-3 py-3 text-sm text-white rounded-lg  hover:bg-white/10"
            >
              <span>Any Query</span>
              <FaChevronDown size={10} />
            </button>

            {openMenu === "QUERY" && (
              <div className="pl-3">

                {menuFor("QUERY").map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    target={item.openInNewTab ? "_blank" : "_self"}
                    rel="noreferrer"
                    onClick={closeMobileMenu}
                    className="
                      block

                      px-3
                      py-2.5

                      text-sm
                      text-white/80

                      rounded-lg

                      hover:bg-white/10
                      hover:text-white
                    "
                  >
                    {item.label}
                  </Link>
                ))}

              </div>
            )}


            {/* ONLINE SERVICES */}

            <button
              onClick={() =>
                setOpenMenu(openMenu === "SERVICES" ? null : "SERVICES")
              }
              className="flex items-center justify-between w-full px-3 py-3 text-sm text-white rounded-lg  hover:bg-white/10"
            >
              <span>Online Services</span>
              <FaChevronDown size={10} />
            </button>

            {openMenu === "SERVICES" && (
              <div className="pl-3">

                {menuFor("SERVICES").map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    target={item.openInNewTab ? "_blank" : "_self"}
                    rel="noreferrer"
                    onClick={closeMobileMenu}
                    className="
                      block

                      px-3
                      py-2.5

                      text-sm
                      text-white/80

                      rounded-lg

                      hover:bg-white/10
                      hover:text-white
                    "
                  >
                    {item.label}
                  </Link>
                ))}

              </div>
            )}


            {/* LOGIN */}

            <button
              onClick={() =>
                setOpenMenu(openMenu === "LOGIN" ? null : "LOGIN")
              }
              className="flex items-center justify-between w-full px-3 py-3 text-sm text-white rounded-lg  hover:bg-white/10"
            >

              <span className="flex items-center gap-2">
                <FaUserCircle size={15} />
                Login
              </span>

              <FaChevronDown size={10} />

            </button>

            {openMenu === "LOGIN" && (
              <div className="pl-3">

                {menuFor("LOGIN").map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className="
                      block

                      px-3
                      py-2.5

                      text-sm
                      text-white/80

                      rounded-lg

                      hover:bg-white/10
                      hover:text-white
                    "
                  >
                    {item.label}
                  </Link>
                ))}

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
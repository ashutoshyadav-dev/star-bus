import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cmsApi } from "../../api/cms";

import banner from "../../assets/banner.png";
import logo   from "../../assets/logo.png";
import Logo   from "../../assets/logo2.jpeg";
import { FaChevronDown, FaUserCircle } from "react-icons/fa";

// Dropdown component — unchanged from your original
function Dropdown({ label, menuKey, openMenu, setOpenMenu, width = "w-56", items = [] }) {
  return (
    <div
      className="relative h-full flex items-center"
      onMouseEnter={() => setOpenMenu(menuKey)}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="h-full flex items-center gap-1 cursor-pointer text-[14px] font-medium hover:text-orange-300 transition-all duration-200 select-none">
        {label}
        <FaChevronDown size={10} className="mt-[1px]" />
      </div>

      {openMenu === menuKey && (
        <div className={`absolute top-full left-0 pt-2 ${width} z-[9999]`}>
          <div className="rounded-xl overflow-hidden backdrop-blur-xl bg-[#0b1f2c]/95 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
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

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [menus,    setMenus]    = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cmsApi.getActiveMenus()
      .then((res) => setMenus(res.data?.data ?? res.data ?? []))
      .catch(console.error);
  }, []);

  // Filter by position — matches cms_menu_position_enum values
  const menuFor = (position) =>
    menus.filter((m) => m.position === position);

  return (
    <div className="absolute top-0 left-0 w-full z-[999]">

      {/* BACKGROUND IMAGE — unchanged */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${banner})` }}
      />

      {/* OVERLAY — unchanged */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#072235]/90 via-[#0b3240]/80 to-[#0d4a2f]/85 backdrop-blur-[2px]" />

      {/* NAVBAR — unchanged layout */}
      <div className="relative flex items-center justify-between px-10 lg:px-12 h-[64px] text-white border-b border-white/10">

        {/* LEFT LOGO — unchanged */}
        <div onClick={() => navigate("/ap")} className="flex items-center gap-3 cursor-pointer min-w-fit">
          <img src={logo} alt="APSTS" className="w-9 h-9 rounded-full object-cover border border-white/30 shadow-md" />
          <div className="leading-tight">
            <p className="text-[14px] font-semibold tracking-wide">Arunachal Pradesh State Transport Services</p>
            <p className="text-[11px] text-white/70">Version 4.0</p>
          </div>
        </div>

        {/* CENTER NAV */}
        <div className="flex items-center gap-10 text-white h-full">
          <span
            onClick={() => navigate("/ap")}
            className="h-full flex items-center cursor-pointer text-[14px] font-medium hover:text-orange-300 transition-all duration-200"
          >
            Home
          </span>

          <Dropdown label="About Us"       menuKey="ABOUT"    openMenu={openMenu} setOpenMenu={setOpenMenu} width="w-56" items={menuFor("ABOUT")} />
          <Dropdown label="Any Query"      menuKey="QUERY"    openMenu={openMenu} setOpenMenu={setOpenMenu} width="w-48" items={menuFor("QUERY")} />
          <Dropdown label="Online Services" menuKey="SERVICES" openMenu={openMenu} setOpenMenu={setOpenMenu} width="w-56" items={menuFor("SERVICES")} />
        </div>

        {/* LOGIN — same structure, now API-driven */}
        <div
          className="relative h-full flex items-center"
          onMouseEnter={() => setOpenMenu("LOGIN")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <div className="flex items-center gap-2 px-5 py-2 rounded-full cursor-pointer text-[14px] font-medium bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-200">
            <FaUserCircle size={16} />
            <span>Login</span>
            <FaChevronDown size={10} />
          </div>

          {openMenu === "LOGIN" && (
            <div className="absolute top-full right-0 pt-2 w-52 z-[9999]">
              <div className="rounded-xl overflow-hidden bg-[#0b1f2c]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
                <div className="py-2">
                  {menuFor("LOGIN").map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
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

          <img src={Logo} alt="Right Logo" className="w-15 h-9 object-cover border border-white/30 shadow-md ml-2" />
        </div>

      </div>
    </div>
  );
}
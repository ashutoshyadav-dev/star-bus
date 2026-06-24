import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import aplogo from "../../assets/aplogo.png";


const Header = () => {
  return (
    <header className="relative w-full overflow-hidden text-white">

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#072235]/90 via-[#0b3240]/80 to-[#0d4a2f]/85" />

      {/* Navbar */}
     <div className="relative z-10 flex flex-col items-center gap-4 px-4 py-3 border-b md:flex-row md:items-center md:justify-between md:h-20 md:px-8 lg:px-12 border-white/10">

  {/* Left Side */}
  <div className="flex items-center gap-3 text-center md:text-left">
    <img
      src={logo}
      alt="logo"
      className="w-12 h-12 border rounded-full border-white/30"
    />

    <div>
   <h2 className="text-xs font-bold leading-tight sm:text-sm md:text-md">
        Arunachal Pradesh State Transport Services
      </h2>
     <p className="text-[10px] sm:text-xs md:text-sm text-white/70">
        Government of Arunachal Pradesh
      </p>
    </div>
  </div>

  {/* Center Button */}
  <div className="flex justify-center w-full lg:w-auto lg:absolute lg:left-1/2 lg:-translate-x-1/2">
  <Link
    to="/ap"
    className="
    px-4 md:px-6
    py-2 md:py-3
    text-sm md:text-base
    font-bold
    text-white
    rounded-full
    bg-gradient-to-r
    from-orange-500
    to-orange-600
    shadow-[0_8px_25px_rgba(249,115,22,0.5)]
    transition-all
    duration-300
    hover:-translate-y-1
    "
  >
    🚍 Online Bus Services
  </Link>
</div>

  {/* Right Logo */}
<div className="flex justify-center md:justify-end">
  <div className="flex items-center justify-center bg-white border-2 border-white rounded-full shadow-lg w-14 h-14 md:w-16 md:h-16">
    <img
      src={aplogo}
      alt="AP Logo"
      className="object-contain w-10 h-10 md:w-12 md:h-12"
    />
  </div>
</div>

</div>
    </header>
  );
};

export default Header;
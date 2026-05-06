import { FiMenu, FiSettings,FiUser } from "react-icons/fi";``

export default function Navbarc({ toggleSidebar }) {
  return (
    <div
      className=" fixed top-0 left-0 w-full z-20 shadow px-6 py-2 flex justify-between items-center
      bg-linear-to-r from-[#163F2D] via-[#081935] to-[#163F2D] text-white"
    >
      
      {/* Left Section */}
      <div className="flex items-center gap-6">

        <button
          onClick={toggleSidebar}
          className="text-xl hover:text-orange-400 transition"
        >
          <FiMenu />
        </button>

        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <img
            src="https://apsts.arunachal.gov.in/Logo/DeptLogo.png"
            alt="logo"
            className="w-10 h-10"
          />

          <div className="leading-tight">
            <h2 className="text-sm font-semibold">
              Arunachal Pradesh
            </h2>
            <p className="text-xs text-gray-300">
              Transport Department
            </p>
          </div>
        </div>

      </div>

      {/* Right Section */}
      <div className="flex items-center gap-5">

        {/* Settings */}
        <button className="text-xl hover:text-orange-400 transition">
          <FiSettings />
        </button>

         <button className="text-xl hover:text-orange-400 transition">
          <FiUser />
        </button>

        {/* Profile Pill */}
        {/* <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/30 transition">

          <img
            src="https://i.pravatar.cc/40"
            alt="profile"
            className="w-7 h-7 rounded-full object-cover"
          />
          

          <span className="text-sm font-medium">
            Customer
          </span> */}

        </div>

      </div>

    
  );
}
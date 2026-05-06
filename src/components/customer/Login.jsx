import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../../assets/logo.png";
import busImage from "../../assets/bus.png";
import { useNavigate } from "react-router-dom";

export default function BusLoginUI() {

const navigate = useNavigate();

const [showPassword, setShowPassword] = useState(false);
const [otpSent, setOtpSent] = useState(false);
const [otp, setOtp] = useState("");

const handleSendOtp = () => {
  setOtpSent(true);
};

const handleResendOtp = () => {
  alert("OTP Resent");
};

  return (
    <div
      className="min-h-screen flex items-center justify-center lg:justify-end bg-cover bg-center relative px-4 sm:px-6 lg:px-16"
      style={{
        backgroundImage: `url(${busImage})`,
        backgroundPosition: "center 90%",
      }}
    >

      {/* Logo */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:left-10 lg:translate-x-0 flex items-center gap-3 text-white z-10">
        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 border-white">
          <img src={logo} alt="logo" className="w-full h-full object-cover" />
        </div>

        <div>
          <h1 className="text-base sm:text-lg lg:text-2xl font-semibold">
            Online Bus Reservation
          </h1>
          <p className="text-xs opacity-90">
            & Transport Management System
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl p-5 sm:p-7 lg:p-8 mt-20 lg:mt-0">

        <h2 className="text-xl sm:text-2xl font-bold text-center text-[#0F3D2E]">
          Welcome Back!
        </h2>

        <p className="text-center text-gray-500 text-xs sm:text-sm mb-5">
          Login using OTP or Password
        </p>

        {/* User Type */}
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-green-700 outline-none">
          <option>Select User Type</option>
          <option>Admin</option>
          <option>User</option>
        </select>

        {/* Phone */}
        <div className="flex items-center border border-gray-300 rounded-lg mb-3 overflow-hidden focus-within:ring-2 focus-within:ring-green-700">
          <div className="px-3 bg-gray-100 text-sm border-r">
            +91
          </div>
          <input
            type="tel"
            placeholder="Enter Mobile Number"
            className="w-full px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Send OTP Button */}
        {!otpSent && (
          <button
            onClick={handleSendOtp}
            className="w-full bg-[#0F3D2E] hover:bg-[#0c2e22] text-white py-2.5 rounded-lg font-semibold mb-4"
          >
            Send OTP
          </button>
        )}

        {/* OTP Input */}
        {otpSent && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm focus:ring-2 focus:ring-green-700 outline-none"
            />

            <p
              onClick={handleResendOtp}
              className="text-right text-xs text-[#0F3D2E] cursor-pointer hover:underline mb-4"
            >
              Resend OTP
            </p>
          </>
        )}

        {/* Password (Optional) */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-green-700 outline-none"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-500"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Login */}
        <button 
        onClick={() => navigate("/user/dashboard")}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold shadow-md">
          LOGIN
        </button>

        {/* Register */}
        <p className="text-center text-xs sm:text-sm mt-5">
          New User{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-orange-500 font-medium cursor-pointer hover:underline"
          >
            Register Here
          </span>
        </p>

      </div>
    </div>
  );
}
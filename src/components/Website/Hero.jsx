import banner from "../../assets/banner.png";
import whereIcon from "../../assets/searchbg.png";
import Navbar from "../Website/Navbar";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";

function Hero() {
    const navigate = useNavigate();
  return (
    <div className="relative w-full">

      {/* <Navbar /> */}

      {/* HERO */}
      <div className="relative min-h-[100vh] pb-28 overflow-visible">

        {/* Background */}
        <div
        className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        ></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[100vh] text-white text-center px-4">
          
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            EXPLORE <br /> ARUNACHAL PRADESH
          </h1>

          <p className="mt-4 text-lg text-gray-200">
            Book a Bus and discover the beauty of Northeast India
          </p>

          {/* <button className="px-6 py-2 mt-6 font-medium bg-orange-500 rounded-md hover:bg-orange-600">
            Book Now
          </button> */}

        </div>

        {/* SEARCH BAR */}
       <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 w-[95%] md:w-[75%] z-20">

 <div
  className="backdrop-blur-md bg-white/20 border border-white/30 shadow-[0_10px_40px_rgba(0,0,0,0.2)] rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center gap-4"
  style={{
    backgroundImage: `url(${whereIcon})`,
    backgroundSize: "cover",
    backgroundPosition: "center"
  }}
>

    
   {/* WHEN */}
<div className="w-full">
  <p className="mb-1 text-xs text-orange-500">When</p>

  <div className="flex items-center bg-gray-100 rounded-full px-4 h-[45px]">
    <FaCalendarAlt className="mr-2 text-gray-400" />
    <input
      type="date"
      className="w-full text-sm bg-transparent outline-none"
    />
  </div>
</div>

{/* FROM */}
<div className="w-full">
  <p className="mb-1 text-xs text-orange-500">From</p>

  <div className="flex items-center bg-gray-100 rounded-full px-4 h-[45px]">
    <FaMapMarkerAlt className="mr-2 text-gray-400" />
    <input
      type="text"
      placeholder="From"
      className="w-full text-sm bg-transparent outline-none"
    />
  </div>
</div>

{/* TO */}
<div className="w-full">
  <p className="mb-1 text-xs text-orange-500">To</p>

  <div className="flex items-center bg-gray-100 rounded-full px-4 h-[45px]">
    <FaMapMarkerAlt className="mr-2 text-gray-400" />
    <input
      type="text"
      placeholder="To"
      className="w-full text-sm bg-transparent outline-none"
    />
  </div>
</div>

    {/* BUTTON */}
    <div className="w-full mt-2 md:w-auto md:mt-5">
      <button
        onClick={() => navigate("/ap/buses")}
        className="bg-orange-500 hover:bg-orange-600 text-white px-8 h-[45px] rounded-full text-sm font-semibold w-full md:w-auto"
      >
        Search
      </button>
    </div>

  </div>
</div>
      </div>

      {/* SPACE */}
      <div className="h-28"></div>

    </div>
  );
}

export default Hero;
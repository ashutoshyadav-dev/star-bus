import banner from "../../assets/banner.png";
import Navbar from "../Website/Navbar";
import Breadcrumb from "../Website/Breadcrumb";
import { FaBullhorn } from "react-icons/fa";

function Tender() {
  return (
    <div className="w-full bg-[#f5f7fa] min-h-screen">
      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <div className="relative h-[320px] flex items-center px-10 pt-20 text-white">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-bold">
            Tender <span className="text-green-400">Notice</span>
          </h1>

          <p className="mt-2 text-gray-200">
            View upcoming tenders and procurement opportunities
          </p>
        </div>
      </div>

      {/* BREADCRUMB */}
      <Breadcrumb title="Tender" />

      {/* CONTENT */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm p-6 bg-white shadow-lg rounded-2xl border border-gray-100">
          
          <div className="flex flex-col items-center text-center">
            
            <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-green-100">
              <FaBullhorn className="text-2xl text-green-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-800">
              Upcoming
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              No tender notifications available at the moment.
            </p>

            <span className="px-4 py-1 mt-4 text-xs font-medium text-green-700 bg-green-100 rounded-full">
              Stay Tuned
            </span>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Tender;
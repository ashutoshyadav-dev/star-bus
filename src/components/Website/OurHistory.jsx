import banner from "../../assets/banner.png";
import Navbar from "../Website/Navbar";
import Breadcrumb from "../Website/Breadcrumb";
import {
  FaBus,
  FaRoute,
  FaBuilding,
  FaNetworkWired,
  FaCheckCircle
} from "react-icons/fa";

function OurHistory() {
  return (
    <div className="w-full bg-[#f5f7fa]">

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <div className="relative h-[320px] flex items-center px-10 pt-20 text-white">

        {/* BG */}
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        ></div>

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>

        {/* CONTENT */}
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-bold">
            Our <span className="text-green-400">History</span>
          </h1>
          <p className="mt-2 text-gray-200">
            Journeying together since 1975 to connect Arunachal Pradesh
          </p>
        </div>
      </div>

      {/* BREADCRUMB */}
      <Breadcrumb title="Our History" />

      {/* MAIN CONTENT */}
      <div className="grid gap-8 px-10 py-12 lg:grid-cols-3">

        {/* LEFT CONTENT */}
        <div className="p-8 bg-white shadow-md rounded-2xl lg:col-span-2">

          {/* TITLE */}
          <h2 className="mb-6 text-2xl font-bold">
            About Our <span className="text-green-500">Journey</span>
            <div className="w-20 h-1 mt-2 bg-green-500 rounded"></div>
          </h2>

          {/* TEXT */}
          <div className="space-y-4 text-gray-600 text-[15px] leading-relaxed">

            <p>
              On 5th of December 1975, Arunachal Pradesh State Transport
              Services (APSTS) started functioning in the State. Initially it
              started functioning with 02 buses from Khonsa (Dist Tirap) to
              Naharkatia (Dist Dibrugarh) of Assam.
            </p>

            <p>
              APSTS strives to provide safe and affordable public transport
              service to the people of Arunachal Pradesh by connecting all
              administrative centres and remote regions.
            </p>

            <p>
              At present, the department has a fleet strength of 280 buses
              covering 119 routes connecting almost all District HQs along with
              other administrative centres.
            </p>

          </div>

          {/* FUTURE */}
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold">
              Future Development Plans
            </h3>

            <ul className="space-y-2 text-sm text-gray-600">
              {[
                "Luxury buses with GPS & AC facilities",
                "Cargo services for remote areas",
                "Student concession cards",
                "Free travel for special categories",
                "Postal mail transport service"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <FaCheckCircle className="mt-1 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">

          {/* STATS */}
          <div className="grid grid-cols-2 gap-4">

            {[
              { icon: <FaBus />, value: "280", label: "Total Buses", color: "text-green-500" },
              { icon: <FaRoute />, value: "119", label: "Routes", color: "text-orange-500" },
              { icon: <FaBuilding />, value: "15", label: "Stations", color: "text-green-500" },
              { icon: <FaNetworkWired />, value: "7", label: "Sub Stations", color: "text-purple-500" },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 text-center transition bg-white shadow-md rounded-xl hover:shadow-lg"
              >
                <div className={`text-2xl ${item.color} mx-auto`}>
                  {item.icon}
                </div>
                <p className="mt-2 text-xl font-bold">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}

          </div>

          {/* HIGHLIGHTS */}
          <div className="p-6 text-white shadow-lg rounded-2xl bg-gradient-to-br from-[#0f2027] to-[#14532d]">

            <h3 className="mb-4 text-lg font-semibold">
              Key Highlights
            </h3>

            <ul className="space-y-2 text-sm">
              {[
                "Safe & Reliable Transport",
                "Connecting All District HQs",
                "Inter-State Bus Services",
                "Cargo & Sumo Services",
                "Serving Remote Areas"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <FaCheckCircle className="mt-1 text-yellow-400" />
                  {item}
                </li>
              ))}
            </ul>

          </div>

        </div>

      </div>

    </div>
  );
}

export default OurHistory;
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMapPin, FiCalendar } from "react-icons/fi";

export default function BookTicket() {
  const navigate = useNavigate();
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [journeyDate, setJourneyDate] = useState("");

  return (
    <div
      className="h-[calc(100vh-80px)]  flex items-center justify-center bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070')",
      }}
    >
      <div className="bg-white p-8 rounded-xl shadow-xl w-[420px]">
        <h2 className="text-xl font-semibold mb-1">Book Your Journey</h2>

        <p className="text-sm text-gray-500 mb-5">
          Search for bus routes and get started.
        </p>

        <div className="flex items-center border  border-gray-300  rounded-lg px-3 py-2 mb-3">
          <FiMapPin className="text-gray-500 mr-2" />
          {/* <input type="text" placeholder="Itanagar" className="w-full outline-none" /> */}
          <select
            value={fromStation}
            onChange={(e) => setFromStation(e.target.value)}
            className="w-full outline-none bg-transparent"
          >
            <option value="">Select From Station</option>
            <option value="1">Itanagar</option>
            <option value="2">Guwahati</option>
          </select>
        </div>

        <div className="flex items-center border  border-gray-300  rounded-lg px-3 py-2 mb-3">
          <FiMapPin className="text-gray-500 mr-2" />
          {/* <input type="text" placeholder="Guwahati" className="w-full outline-none" /> */}
          <select
            value={toStation}
            onChange={(e) => setToStation(e.target.value)}
            className="w-full outline-none bg-transparent"
          >
            <option value="">Select To Station</option>
            <option value="1">Itanagar</option>
            <option value="2">Guwahati</option>
          </select>
        </div>

        <div className="flex items-center border border-gray-300  rounded-lg px-3 py-2 mb-5">
          <FiCalendar className="text-gray-500 mr-2" />
          {/* <input type="date" className="w-full outline-none" /> */}
          <input
            type="date"
            value={journeyDate}
            onChange={(e) => setJourneyDate(e.target.value)}
            className="w-full outline-none"
          />
        </div>

        <button
          onClick={() => {
            if (!fromStation || !toStation || !journeyDate) {
              alert("Please fill all fields");
              return;
            }

            navigate("/user/search-results", {
              state: {
                from_station_id: fromStation,
                to_station_id: toStation,
                journey_date: journeyDate,
              },
            });
          }}
          className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600"
        >
          Search Buses
        </button>
      </div>
    </div>
  );
}

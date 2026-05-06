import { useNavigate, useLocation } from "react-router-dom";
import { FiMapPin, FiCalendar, FiArrowRight } from "react-icons/fi";

// Temporary static data
const buses = [
  {
    id: 1,
    name: "Speed Travels",
    route: "Itanagar → Guwahati",
    type: "AC Sleeper",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnCd2wYrD9rEkBu42X6tbhG1Rpjneb_GJdUg&s",
    depart: "07:00 AM",
    arrive: "11:30 AM",
    duration: "4h 30m",
    price: 950,
    seats: 15,
  },
  {
    id: 2,
    name: "Cityline Travels",
    route: "Itanagar → Guwahati",
    type: "Non AC Seater",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6IcLaUfoq--Q02k0SOV6x7vRA235VFJydUQ&s",
    depart: "08:15 AM",
    arrive: "12:45 PM",
    duration: "4h 30m",
    price: 1050,
    seats: 8,
  },
  {
    id: 3,
    name: "Express Tours",
    route: "Itanagar → Guwahati",
    type: "AC Seater",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPnMCBjo8URnZZMDqF_Cb0BwETU90iFgDe-Q&s",
    depart: "09:30 AM",
    arrive: "02:00 PM",
    duration: "4h 30m",
    price: 750,
    seats: 20,
  },
];

export default function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();

  console.log("Current Path:", location.pathname);
  console.log("Received State:", location.state);

  const { from_station_id, to_station_id, journey_date } = location.state || {};

  if (!from_station_id) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-lg text-gray-600">Please search buses first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {from_station_id} → {to_station_id}
          </h2>
          <p className="text-sm text-gray-500">
            {journey_date} • {buses.length} Buses Found
          </p>
        </div>

        <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100">
          Filters
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-xl p-4 flex gap-4 items-center">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 flex-1">
          <FiMapPin />
          <input
            type="text"
            value={from_station_id}
            readOnly
            className="outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 flex-1">
          <FiMapPin />
          <input
            type="text"
            value={to_station_id}
            readOnly
            className="outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 flex-1">
          <FiCalendar />
          <input
            type="date"
            value={journey_date}
            readOnly
            className="outline-none w-full"
          />
        </div>

        <button className="bg-[#163F2D] text-white px-6 py-2 rounded-lg">
          Search Buses
        </button>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Filters */}
        <div className="w-64 bg-white shadow rounded-xl p-5 h-fit">
          <h3 className="font-semibold mb-4">Filters</h3>

          <div className="mb-4">
            <p className="font-medium mb-2">Bus Type</p>
            <div className="flex flex-col gap-2 text-sm">
              <label>
                <input type="checkbox" /> AC Bus
              </label>
              <label>
                <input type="checkbox" /> Non AC Bus
              </label>
              <label>
                <input type="checkbox" /> Sleeper Bus
              </label>
              <label>
                <input type="checkbox" /> Luxury Bus
              </label>
            </div>
          </div>
        </div>

        {/* Bus List */}
        <div className="flex-1 space-y-4">
          {buses.map((bus) => (
            <div
              key={bus.id}
              className="bg-white shadow rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={bus.img}
                  alt={bus.name}
                  className="w-28 h-20 object-cover rounded-md"
                />

                <div>
                  <h3 className="font-semibold text-lg">{bus.name}</h3>
                  <p className="text-sm text-gray-500">{bus.route}</p>
                  <p className="text-sm text-gray-500">{bus.type}</p>

                  <div className="flex items-center gap-4 text-sm mt-2 text-gray-600">
                    <p>{bus.depart}</p>
                    <FiArrowRight />
                    <p>{bus.arrive}</p>
                  </div>

                  <div className="flex gap-6 text-sm mt-1 text-gray-500">
                    <p>{bus.duration}</p>
                    <p>{bus.seats} Seats Available</p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-[#163F2D]">
                  ₹ {bus.price}
                </p>

                <button
                  onClick={() => {
                  
                    

                    navigate("/user/seat", {
                      state: {
                        bus_id: bus.id,
                        from_station_id,
                        to_station_id,
                        journey_date,
                        price: bus.price,
                      },
                    });
                  }}
                  className="relative z-50 mt-2 bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600"
                >
                  Select Seat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

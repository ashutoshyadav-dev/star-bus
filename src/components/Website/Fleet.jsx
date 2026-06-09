import { useNavigate } from "react-router-dom";

import bus1 from "../../assets/bus1.png";
import bus2 from "../../assets/bus2.png";
import bus3 from "../../assets/bus3.png";
import bus4 from "../../assets/bus4.png";
import bus5 from "../../assets/bus5.png";
import bus6 from "../../assets/bus6.png";

function Fleet() {
  const navigate = useNavigate();

  
  const vehicles = [
    { id: 1, name: "Electric Bus", category: "Bus", img: bus1 },
    { id: 2, name: "Force Cruiser", category: "Van", img: bus2 },
    { id: 3, name: "Force Traveler", category: "Van", img: bus3 },
    { id: 4, name: "Semi Deluxe", category: "Bus", img: bus4 },
    { id: 5, name: "Tata Sumo", category: "Car", img: bus5 },
    { id: 6, name: "Standard", category: "Bus", img: bus6 },
    { id: 7, name: "Ultra Bus", category: "Bus", img: bus1 },
    { id: 8, name: "Volvo", category: "Bus", img: bus2 },
  ];

  

  return (
    <div className="px-10 py-16 bg-gray-100">

      {/* Heading */}
      <div className="relative mb-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Fleet</h2>
          <p className="text-sm text-gray-500">
            Choose from our wide range of vehicles
          </p>
        </div>

        <button className="absolute top-0 right-0 px-4 py-2 text-sm text-white bg-orange-500 rounded-full">
          View All
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-6">

        {vehicles.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden transition bg-white shadow rounded-xl hover:shadow-lg"
          >
            <img
              src={item.img}
              alt={item.name}
              className="object-cover w-full h-40"
            />

            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{item.name}</h3>
                <span className="text-sm text-orange-500">★ 4.5</span>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Petrol • Manual
              </p>

              {/* Optional future use: category display (UI untouched) */}
              {/* <p className="text-xs text-gray-400">{item.category}</p> */}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() =>
                    navigate("/ap/routes", { state: { bus: item.name } })
                  }
                  className="bg-[#0f2c3f] text-white px-3 py-1 rounded text-sm"
                >
                  Routes
                </button>

                <button
                  onClick={() => navigate("/time")}
                  className="bg-[#0f2c3f] text-white px-3 py-1 rounded text-sm"
                >
                  Time
                </button>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}

export default Fleet;
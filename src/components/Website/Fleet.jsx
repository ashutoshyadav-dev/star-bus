import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { buildImageUrl } from "../../api/cms";
import busPlaceholder from "../../assets/bus1.png";

function Fleet() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/bus-types?activeOnly=true")
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setVehicles(data);
      })
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-10 py-16 bg-gray-100">

      <div className="relative mb-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Fleet</h2>
          <p className="text-sm text-gray-500">Choose from our wide range of vehicles</p>
        </div>
        <button className="absolute top-0 right-0 px-4 py-2 text-sm text-white bg-orange-500 rounded-full">
          View All
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No vehicles found.</p>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {vehicles.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden transition bg-white shadow rounded-xl hover:shadow-lg"
            >
              <img
                src={item.imageUrl ? buildImageUrl(item.imageUrl) : busPlaceholder}
                alt={item.name}
                className="object-cover w-full h-40"
                onError={(e) => { e.target.src = busPlaceholder; }}
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{item.name}</h3>
                  <span className="text-sm text-orange-500">★ 4.5</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {item.hasAc ? "AC" : "Non-AC"} • {item.totalSeats} Seats
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate("/home/routes", { state: { bus: item.name } })}
                    className="bg-[#0f2c3f] text-white px-3 py-1 rounded text-sm"
                  >
                    Routes
                  </button>
                  <button
                    onClick={() => navigate("/home/timetable")}
                    className="bg-[#0f2c3f] text-white px-3 py-1 rounded text-sm"
                  >
                    Time
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Fleet;
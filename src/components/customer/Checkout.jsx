import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Checkout() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // 🔹 Data from previous page
  const {
    bus_id,
    from_station_id,
    to_station_id,
    journey_date,
    selectedSeats = [],
    total_amount = 0,
  } = state || {};

  // 🔹 Safety check
  if (!selectedSeats.length) {
    return (
      <p className="text-center mt-10 text-gray-600">
        Please select seats first
      </p>
    );
  }

  // 🔹 Passenger form state
  const [passengers, setPassengers] = useState(
    selectedSeats.map(() => ({
      passenger_name: "",
      age: "",
      gender: "",
    }))
  );

  // 🔹 Handle input change
  const handleChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  // 🔹 Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    navigate("/payment", {
      state: {
        bus_id,
        from_station_id,
        to_station_id,
        journey_date,
        selectedSeats,
        passengers,
        total_amount,
      },
    });
  };

  return (
    <div className="">

      <div className="mb-6">
        <h2 className=" text-xl font-bold text-gray-800">
          Itanagar → Guwahati
        </h2>
        <p className="text-sm text-gray-500">
          {journey_date}  Volvo AC Sleeper
        </p>
      </div>

      <div className="flex gap-6">
        {/* LEFT: Passenger Form */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow">

          <h2 className="font-semibold mb-4">
            Passenger Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            {passengers.map((p, index) => (
              <div key={index} className="p-4 rounded-lg">
                <h3 className="font-medium mb-2">
                  Passenger {index + 1}
                </h3>

                <div className="grid grid-cols-3 gap-4">

                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={p.passenger_name}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "passenger_name",
                        e.target.value
                      )
                    }
                    className="border border-gray-300 p-2 rounded"
                  />

                  <input
                    type="number"
                    placeholder="Age"
                    required
                    value={p.age}
                    onChange={(e) =>
                      handleChange(index, "age", e.target.value)
                    }
                    className="border border-gray-300 p-2 rounded"
                  />

                  <select
                    required
                    value={p.gender}
                    onChange={(e) =>
                      handleChange(index, "gender", e.target.value)
                    }
                    className="border border-gray-300 p-2 rounded"
                  >
                    <option value="">Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>

                </div>
              </div>
            ))}

            <button
              type="submit"
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
            >
              Proceed to Payment
            </button>

          </form>
        </div>

        {/* RIGHT: Summary */}
        <div className="w-1/3 bg-white p-6 rounded-xl shadow h-fit">

          <h3 className="font-semibold mb-4">
            Booking Summary
          </h3>

          <p className="text-sm mb-2">
            Bus ID:{" "}
            <span className="font-medium">{bus_id}</span>
          </p>

          <p className="text-sm mb-2">
            Date:{" "}
            <span className="font-medium">{journey_date}</span>
          </p>

          <p className="text-sm mb-2">
            Seats:{" "}
            <span className="font-medium">
              {selectedSeats.join(", ")}
            </span>
          </p>

          <p className="text-lg font-semibold text-green-700">
            Total: ₹{total_amount}
          </p>

        </div>
</div>
      </div>
      );
}
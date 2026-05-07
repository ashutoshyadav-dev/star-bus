import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { Armchair } from "lucide-react";
import { getScheduleSeats  } from "../../api/schedule";

export default function SeatInventoryManagement() {
  const { id } = useParams();

  const { data, isLoading } = useQuery(
    ["schedule-seats", id],
    () => getScheduleSeats(id)
  );

  const seats = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-800">
            Seat Inventory
          </h1>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            Loading seats...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6">

            {seats.map((seat) => (
              <div
                key={seat.id}
                className={`border rounded-xl p-4 text-center ${
                  seat.seatStatus === "available"
                    ? "bg-green-50 border-green-200"
                    : seat.seatStatus === "booked"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <Armchair className="mx-auto mb-2" size={22} />

                <div className="font-semibold">
                  {seat.seatLabel}
                </div>

                <div className="text-xs mt-1 capitalize">
                  {seat.seatStatus}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Bus,
  Route,
  Users,
} from "lucide-react";
import { getScheduleById } from "../../api/schedule";

export default function ScheduleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(
    ["schedule", id],
    () => getScheduleById(id),
    {
      enabled: !!id,
    }
  );

  const schedule = data?.data;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-400">
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-blue-600 mb-5 hover:underline"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-800">
              Schedule Details
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6">

            <InfoCard
              icon={<Route size={18} />}
              label="Route"
              value={schedule?.routeName}
            />

            <InfoCard
              icon={<Bus size={18} />}
              label="Bus Number"
              value={schedule?.registrationNumber}
            />

            <InfoCard
              icon={<Calendar size={18} />}
              label="Journey Date"
              value={schedule?.journeyDate}
            />

            <InfoCard
              icon={<Clock size={18} />}
              label="Departure Time"
              value={schedule?.departureTime}
            />

            <InfoCard
              icon={<Users size={18} />}
              label="Available Seats"
              value={schedule?.availableSeats}
            />

            <InfoCard
              icon={<Users size={18} />}
              label="Total Seats"
              value={schedule?.totalSeats}
            />

            <InfoCard
              label="Trip Status"
              value={schedule?.tripStatus}
            />

            <InfoCard
              label="Booking Open"
              value={schedule?.isBookingOpen ? "Yes" : "No"}
            />
          </div>

          <div className="border-t border-gray-100 p-6 flex gap-3 flex-wrap">
            <button
              onClick={() =>
                navigate(`/admin/schedules/${id}/seats`)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm"
            >
              Seat Inventory
            </button>

            <button
              onClick={() =>
                navigate(`/admin/schedules/${id}/duty`)
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm"
            >
              Duty Assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="border rounded-xl p-4 bg-gray-50">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
        {icon}
        {label}
      </div>

      <div className="font-semibold text-gray-800">
        {value || "—"}
      </div>
    </div>
  );
}
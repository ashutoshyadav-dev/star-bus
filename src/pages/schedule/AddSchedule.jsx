import { useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Bus,
  Calendar,
  Clock,
  Route as RouteIcon,
  Save,
} from "lucide-react";

import toast from "react-hot-toast";

import { getAllBuses } from "../../api/bus";
import { getAllRoutes, getStops } from "../../api/route";
import { createSchedule } from "../../api/schedule";

export default function AddSchedule() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    routeId: "",
    busId: "",
    journeyDate: "",
    departureTime: "",
    bookingClosesAt: "",
  });


  const { data: stopsData } = useQuery(
  ["stops", form.routeId],
  () => getStops(form.routeId),
  { enabled: !!form.routeId }
);
const stopCount = stopsData?.data?.data?.length ?? 0;
const routeHasEnoughStops = !form.routeId || stopCount >= 2;

  /* ROUTES */
  const {
    data: routesResponse,
    isLoading: routesLoading,
  } = useQuery(
  ["routes"],
  () => getAllRoutes()
);

  /* BUSES */
  const {
    data: busesResponse,
    isLoading: busesLoading,
  } = useQuery(
  ["buses"],
  () => getAllBuses()
);
  /*
    Handles both:
    response.data
    and direct array response
  */
// const routes = Array.isArray(routesResponse?.data?.data)
//   ? routesResponse.data.data
//   : [];

const allRoutes = Array.isArray(routesResponse?.data?.data)
  ? routesResponse.data.data
  : [];
const routes = allRoutes.filter(r => r.status === "active" || r.status === "ACTIVE");

const buses = Array.isArray(busesResponse?.data)
  ? busesResponse.data
  : [];

  console.log("routes", routes);
  console.log("buses", buses);

  /* CREATE */
  const createMutation = useMutation(
    (payload) => createSchedule(payload),
    {
      onSuccess: () => {
        toast.success("Schedule created successfully");
        navigate("/admin/schedules");
      },

      onError: (err) => {
        toast.error(
          err?.response?.data?.message ||
            "Failed to create schedule"
        );
      },
    }
  );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = (e) => {
  e.preventDefault();

  createMutation.mutate({
    routeId: Number(form.routeId),
    busId: Number(form.busId),
    journeyDate: form.journeyDate,
    departureTime: form.departureTime + ":00",

    bookingClosesAt: form.bookingClosesAt
      ? new Date(form.bookingClosesAt).toISOString()
      : null,
  });
};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-blue-600 mb-5 hover:underline"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* HEADER */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-800">
              Create Schedule
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Add a new bus schedule
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* ROUTE */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Route
                </label>

                <div className="flex items-center border rounded-xl px-3">
                  <RouteIcon
                    size={18}
                    className="text-gray-400 mr-2"
                  />

                  <select
                    name="routeId"
                    value={form.routeId}
                    onChange={handleChange}
                    required
                    className="w-full py-3 outline-none text-sm bg-transparent"
                  >
                    <option value="">
                      {routesLoading
                        ? "Loading routes..."
                        : "Select Route"}
                    </option>

                    {routes.map((route) => (
                      <option
                        key={route.id}
                        value={route.id}
                      >
                        {route.name} (
                        {route.originStationName} →
                        {" "}
                        {route.destinationStationName}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BUS */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Bus
                </label>

                <div className="flex items-center border rounded-xl px-3">
                  <Bus
                    size={18}
                    className="text-gray-400 mr-2"
                  />

                  <select
                    name="busId"
                    value={form.busId}
                    onChange={handleChange}
                    required
                    className="w-full py-3 outline-none text-sm bg-transparent"
                  >
                    <option value="">
                      {busesLoading
                        ? "Loading buses..."
                        : "Select Bus"}
                    </option>

                    {buses.map((bus) => (
                      <option
                        key={bus.id}
                        value={bus.id}
                      >
                        {bus.registrationNumber}
                        {" "}
                        ({bus.busTypeName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* JOURNEY DATE */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Journey Date
                </label>

                <div className="flex items-center border rounded-xl px-3">
                  <Calendar
                    size={18}
                    className="text-gray-400 mr-2"
                  />

                  <input
                    type="date"
                    name="journeyDate"
                    value={form.journeyDate}
                    onChange={handleChange}
                    required
                    className="w-full py-3 outline-none text-sm"
                  />
                </div>
              </div>

              {/* DEPARTURE */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Departure Time
                </label>

                <div className="flex items-center border rounded-xl px-3">
                  <Clock
                    size={18}
                    className="text-gray-400 mr-2"
                  />

                  <input
                    type="time"
                    name="departureTime"
                    value={form.departureTime}
                    onChange={handleChange}
                    required
                    className="w-full py-3 outline-none text-sm"
                  />
                </div>
              </div>

              {/* BOOKING CLOSE */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Booking Closes At
                </label>

                <input
                  type="datetime-local"
                  name="bookingClosesAt"
                  value={form.bookingClosesAt}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3 outline-none text-sm"
                />
              </div>
            </div>

            {/* SUBMIT */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isLoading || !routeHasEnoughStops}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />

                {createMutation.isLoading
                  ? "Creating..."
                  : "Create Schedule"}
              </button>
            </div>

            {form.routeId && stopCount < 2 && (
                 <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                   <span className="text-amber-500 mt-0.5">⚠️</span>
                   <div>
                     <p className="font-medium">This route has {stopCount} stop{stopCount === 1 ? "" : "s"}.</p>
                     <p className="text-xs mt-0.5">
                       You need at least 2 stops before creating a schedule.
                       Go to <strong>Route → Stops</strong> tab and add them first.
                     </p>
                   </div>
                 </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}
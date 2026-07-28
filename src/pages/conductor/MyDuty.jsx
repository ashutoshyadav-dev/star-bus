import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getDutyAssignmentsByStaff, checkInDuty, checkOutDuty } from "../../api/schedule";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/common/Spinner";

export default function MyDuty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDutyAssignmentsByStaff(user.sub ?? user.id)
      .then((res) => {
        const all = res.data?.data ?? res.data ?? [];
        // Client-side filter to today — no dedicated backend query for this yet
        const today = new Date().toDateString();
        setDuties(all.filter((d) => new Date(d.schedule?.journeyDate ?? d.journeyDate).toDateString() === today));
      })
      .catch(() => toast.error("Failed to load duties"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckIn = async (duty) => {
    try {
      await checkInDuty(duty.id);
      toast.success("Checked in — loading manifest…");
      navigate(`/conductor/scan/${duty.scheduleId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Check-in failed");
    }
  };

  const handleCheckOut = async (duty) => {
    try {
      await checkOutDuty(duty.id);
      toast.success("Checked out");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Check-out failed");
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Duty — Today</h1>

      {duties.length === 0 ? (
        <div className="text-center text-gray-400 py-16">No duty assigned for today</div>
      ) : (
        <div className="space-y-4 max-w-lg">
          {duties.map((duty) => (
            <div key={duty.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="font-semibold text-gray-800">{duty.dutyRole}</div>
              <div className="text-sm text-gray-500 mb-3">
                Schedule: {duty.scheduleId}
              </div>
              {!duty.checkInAt ? (
                <button onClick={() => handleCheckIn(duty)}
                        className="w-full bg-green-600 text-white rounded-lg py-2.5 font-semibold hover:bg-green-700">
                  Start Duty (Check In)
                </button>
              ) : !duty.checkOutAt ? (
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/conductor/scan/${duty.scheduleId}`)}
                          className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-700">
                    Continue Scanning
                  </button>
                  <button onClick={() => handleCheckOut(duty)}
                          className="flex-1 bg-red-100 text-red-700 rounded-lg py-2.5 font-semibold hover:bg-red-200">
                    End Duty
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Duty completed</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
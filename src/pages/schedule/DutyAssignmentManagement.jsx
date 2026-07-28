// import React from "react";
// import { useParams } from "react-router-dom";
// import { useQuery } from "react-query";
// import { User, ShieldCheck } from "lucide-react";
// import { getDutyAssignmentsBySchedule } from "../../api/schedule";

// export default function DutyAssignmentManagement() {
//   const { id } = useParams();

//   const { data, isLoading } = useQuery(
//     ["duties", id],
//     () => getDutyAssignmentsBySchedule(id)
//   );

//   const duties = data?.data || [];

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">

//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

//         <div className="p-6 border-b border-gray-100">
//           <h1 className="text-2xl font-semibold text-gray-800">
//             Duty Assignments
//           </h1>
//         </div>

//         {isLoading ? (
//           <div className="p-8 text-center text-gray-400">
//             Loading assignments...
//           </div>
//         ) : duties.length === 0 ? (
//           <div className="p-8 text-center text-gray-400">
//             No assignments found
//           </div>
//         ) : (
//           <div className="divide-y divide-gray-100">

//             {duties.map((duty) => (
//               <div
//                 key={duty.id}
//                 className="p-5 flex items-center justify-between"
//               >
//                 <div className="flex items-center gap-4">

//                   <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
//                     <User size={20} />
//                   </div>

//                   <div>
//                     <div className="font-semibold text-gray-800">
//                       {duty.dutyRole}
//                     </div>

//                     <div className="text-sm text-gray-500">
//                       Staff ID: {duty.staffUserId}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2 text-green-600 text-sm">
//                   <ShieldCheck size={16} />
//                   Assigned
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }










import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import { User, ShieldCheck, LogIn, LogOut, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import {
  getDutyAssignmentsBySchedule, assignDuty, checkInDuty, checkOutDuty,
} from "../../api/schedule";
import { usersApi } from "../../api/users";

const DUTY_ROLES = ["conductor", "driver", "relief_driver", "guard"];

export default function DutyAssignmentManagement() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    ["duties", id],
    () => getDutyAssignmentsBySchedule(id)
  );
  const duties = data?.data?.data ?? data?.data ?? [];

  // ── staff name resolution — the old version showed raw UUIDs ────────────
  const [staffNames, setStaffNames] = useState({});
  useEffect(() => {
    duties.forEach((duty) => {
      if (staffNames[duty.staffUserId]) return;
      usersApi.getById(duty.staffUserId)
        .then((res) => {
          const u = res.data?.data ?? res.data;
          setStaffNames((prev) => ({ ...prev, [duty.staffUserId]: u?.fullName ?? u?.phoneNumber }));
        })
        .catch(() => {});
    });
  }, [duties]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── assign form ───────────────────────────────────────────────────────────
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [dutyRole, setDutyRole] = useState("conductor");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      usersApi.search(search)
        .then((res) => setSearchResults(res.data?.data ?? res.data ?? []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleAssign = async () => {
    if (!selectedStaff) { toast.error("Select a staff member"); return; }
    setAssigning(true);
    try {
      await assignDuty({ scheduleId: id, staffUserId: selectedStaff.id, dutyRole });
      toast.success("Duty assigned");
      setShowAssignForm(false);
      setSelectedStaff(null);
      setSearch("");
      queryClient.invalidateQueries(["duties", id]);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to assign duty");
    } finally {
      setAssigning(false);
    }
  };

  const handleCheckIn = async (dutyId) => {
    try {
      await checkInDuty(dutyId);
      toast.success("Checked in");
      queryClient.invalidateQueries(["duties", id]);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Check-in failed");
    }
  };

  const handleCheckOut = async (dutyId) => {
    try {
      await checkOutDuty(dutyId);
      toast.success("Checked out");
      queryClient.invalidateQueries(["duties", id]);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Check-out failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Duty Assignments</h1>
          <button
            onClick={() => setShowAssignForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <UserPlus size={16} /> Assign Duty
          </button>
        </div>

        {showAssignForm && (
          <div className="p-6 border-b border-gray-100 bg-blue-50/50">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Search staff by name or phone"
                  value={selectedStaff ? selectedStaff.fullName : search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedStaff(null); }}
                />
                {searchResults.length > 0 && !selectedStaff && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-auto">
                    {searchResults.map((u) => (
                      <div key={u.id}
                           onClick={() => { setSelectedStaff(u); setSearchResults([]); }}
                           className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                        {u.fullName ?? u.phoneNumber}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <select value={dutyRole} onChange={(e) => setDutyRole(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2">
                {DUTY_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>

              <button onClick={handleAssign} disabled={assigning}
                      className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 disabled:opacity-60">
                {assigning ? "Assigning…" : "Confirm Assignment"}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading assignments...</div>
        ) : duties.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No assignments found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {duties.map((duty) => (
              <div key={duty.id} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{duty.dutyRole}</div>
                    <div className="text-sm text-gray-500">
                      {staffNames[duty.staffUserId] ?? "Loading…"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {duty.checkInAt ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <ShieldCheck size={16} /> On duty since {new Date(duty.checkInAt).toLocaleTimeString()}
                    </span>
                  ) : (
                    <button onClick={() => handleCheckIn(duty.id)}
                            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">
                      <LogIn size={14} /> Check In
                    </button>
                  )}
                  {duty.checkInAt && !duty.checkOutAt && (
                    <button onClick={() => handleCheckOut(duty.id)}
                            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">
                      <LogOut size={14} /> Check Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
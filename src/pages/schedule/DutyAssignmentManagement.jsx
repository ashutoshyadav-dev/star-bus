import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { User, ShieldCheck } from "lucide-react";
import { getDutyAssignmentsBySchedule } from "../../api/schedule";

export default function DutyAssignmentManagement() {
  const { id } = useParams();

  const { data, isLoading } = useQuery(
    ["duties", id],
    () => getDutyAssignmentsBySchedule(id)
  );

  const duties = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-800">
            Duty Assignments
          </h1>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            Loading assignments...
          </div>
        ) : duties.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No assignments found
          </div>
        ) : (
          <div className="divide-y divide-gray-100">

            {duties.map((duty) => (
              <div
                key={duty.id}
                className="p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <User size={20} />
                  </div>

                  <div>
                    <div className="font-semibold text-gray-800">
                      {duty.dutyRole}
                    </div>

                    <div className="text-sm text-gray-500">
                      Staff ID: {duty.staffUserId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <ShieldCheck size={16} />
                  Assigned
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
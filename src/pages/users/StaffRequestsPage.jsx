import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ArrowLeft, UserCheck, Trash2, Phone, Mail, Hash, Briefcase, Calendar } from "lucide-react";
import { usersApi } from "../../api/users";
import { rolesApi } from "../../api/roles";
import { depotApi } from "../../api/depot";
import { useConfirm } from "../../components/common/ConfirmDialog";

const unwrapList = (res) =>
  Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];

const pretty = (s) => (s ? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "—");
const fmtDate = (d) => {
  try { return d ? format(new Date(d), "dd MMM yyyy") : "—"; } catch { return "—"; }
};
const stripCC = (p = "") => p.replace(/^(\+91|91)/, "").slice(-10);

const selectCls =
  "w-full h-10 px-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

/** Suggest the role that matches the designation the person registered with. */
const SUGGESTED_ROLE = {
  driver: "driver",
  conductor: "conductor",
  ticket_checker: "ticket_checker",
  counter_clerk: "counter",
  depot_manager: "depot_manager",
  route_manager: "route_manager",
  accounts_officer: "accounts_officer",
};

function ApproveModal({ request, roles, depots, onClose, onDone }) {
  const initialRole =
    roles.find((r) => r.name === SUGGESTED_ROLE[request.designation])?.id ?? "";
  const [roleId, setRoleId] = useState(initialRole ? String(initialRole) : "");
  const [depotId, setDepotId] = useState(request.depotId ? String(request.depotId) : "");

  const mutation = useMutation(
    () => usersApi.approveStaff(request.userId, {
      roleId: Number(roleId),
      depotId: depotId ? Number(depotId) : null,
    }),
    {
      onSuccess: () => {
        toast.success(`${request.fullName} can now log in`);
        onDone();
      },
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-slate-800">Assign role</h2>
        <p className="mt-1 text-sm text-slate-500">
          {request.fullName} · {request.employeeCode} · registered as {pretty(request.designation)}
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Role <span className="text-red-500">*</span></span>
            <select className={selectCls} value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.displayName ?? r.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Depot</span>
            <select className={selectCls} value={depotId} onChange={(e) => setDepotId(e.target.value)}>
              <option value="">Not assigned</option>
              {depots.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!roleId || mutation.isLoading}
            className="h-9 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isLoading ? "Saving…" : "Approve & assign"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffRequestsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isError } = useQuery(["staff-requests"], usersApi.getPendingStaff);
  const requests = unwrapList(data);

  const { data: rolesData } = useQuery("roles", rolesApi.getAll, { staleTime: 5 * 60_000 });
  // passenger is never an option for staff
  const roles = unwrapList(rolesData).filter((r) => r.name !== "passenger");

  const { data: depotsData } = useQuery("depots", depotApi.getAllDepots, { staleTime: 10 * 60_000 });
  const depots = unwrapList(depotsData);

  const reject = async (req) => {
    const ok = await confirm({
      title: "Reject this registration?",
      message: `${req.fullName} (${req.employeeCode}) will be removed and will need to register again.`,
      tone: "danger",
      confirmText: "Reject",
    });
    if (!ok) return;
    try {
      await usersApi.delete(req.userId);
      toast.success("Registration rejected");
      qc.invalidateQueries(["staff-requests"]);
    } catch {
      /* interceptor toasts */
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <button
          onClick={() => navigate("/admin/users")}
          className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Users
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-800">Staff Requests</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Staff who registered themselves and are waiting for a role. They can log in only after you assign one.
          </p>
        </div>

        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {isError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Could not load staff requests.</p>
        )}
        {!isLoading && !isError && requests.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No pending registrations.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((r) => (
            <div key={r.userId} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{r.fullName}</p>
                  <p className="text-xs text-slate-400">Registered {fmtDate(r.registeredAt)}</p>
                </div>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                  Awaiting role
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2"><Hash className="h-3.5 w-3.5 text-slate-400" />{r.employeeCode}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{stripCC(r.phoneNumber)}</div>
                <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-slate-400" />{pretty(r.designation)}</div>
                <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-slate-400" />{pretty(r.employmentType)}</div>
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-400" />DOB {fmtDate(r.dateOfBirth)}</div>
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-400" />Joined {fmtDate(r.joiningDate)}</div>
                {r.email && <div className="col-span-2 flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" />{r.email}</div>}
                {r.licenseNumber && (
                  <div className="col-span-2 text-xs text-slate-500">
                    Licence {r.licenseNumber}{r.licenseExpiryDate ? ` · expires ${fmtDate(r.licenseExpiryDate)}` : ""}
                  </div>
                )}
              </dl>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => reject(r)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Reject
                </button>
                <button
                  onClick={() => setSelected(r)}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <UserCheck className="h-3.5 w-3.5" /> Assign role
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <ApproveModal
          request={selected}
          roles={roles}
          depots={depots}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            qc.invalidateQueries(["staff-requests"]);
            qc.invalidateQueries("users");
          }}
        />
      )}
    </div>
  );
}

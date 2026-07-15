import { useState, useEffect } from "react";
import { cmsApi } from "../../api/cms";
import toast from "react-hot-toast";

const POSITIONS = ["ABOUT", "QUERY", "SERVICES", "LOGIN"];

const EMPTY_FORM = {
  label: "", path: "", position: "ABOUT",
  sortOrder: 0, openInNewTab: false, isActive: true,
};

function AdminMenu() {
  const [menus,   setMenus]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    cmsApi.adminGetAllMenus()
      .then((res) => setMenus(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load menus."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.label.trim()) { toast.error("Label is required."); return; }
    if (!form.path.trim())  { toast.error("Path is required.");  return; }

    setSaving(true);
    try {
      if (editing) {
        await cmsApi.adminUpdateMenu(editing, form);
        toast.success("Menu item updated.");
      } else {
        await cmsApi.adminCreateMenu(form);
        toast.success("Menu item added.");
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditing(m.id);
    setForm({
      label: m.label, path: m.path, position: m.position,
      sortOrder: m.sortOrder, openInNewTab: m.openInNewTab, isActive: m.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Delete this menu item?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await cmsApi.adminDeleteMenu(id);
                toast.success("Menu item deleted.");
                load();
              } catch {
                toast.error("Delete failed.");
              }
            }}
            className="px-3 py-1 bg-red-500 text-white rounded text-xs"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 border rounded text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const grouped = menus.reduce((acc, m) => {
    if (!acc[m.position]) acc[m.position] = [];
    acc[m.position].push(m);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Menu Management</h1>

      {/* Form card */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="font-semibold text-gray-700 mb-4">
          {editing ? "Edit Menu Item" : "Add New Menu Item"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text" placeholder="Label *"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text" placeholder="Path * (e.g. /home/about)"
            value={form.path}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            type="number" placeholder="Sort order"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox" checked={form.openInNewTab}
              onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })}
            />
            Open in new tab
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox" checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update" : "Add Menu Item"}
          </button>
          {editing && (
            <button
              onClick={() => { setEditing(null); setForm(EMPTY_FORM); }}
              className="px-6 py-2 border rounded-full text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tables grouped by position */}
      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-center text-gray-400 py-10">No menu items yet.</p>
      ) : (
        Object.entries(grouped).map(([pos, items]) => (
          <div key={pos} className="bg-white rounded-2xl shadow mb-6 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-700">{pos}</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Label</th>
                  <th className="px-4 py-2 text-left">Path</th>
                  <th className="px-4 py-2 text-center">Order</th>
                  <th className="px-4 py-2 text-center">New Tab</th>
                  <th className="px-4 py-2 text-center">Active</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{m.label}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.path}</td>
                    <td className="px-4 py-3 text-center">{m.sortOrder}</td>
                    <td className="px-4 py-3 text-center">{m.openInNewTab ? "✓" : "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {m.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => startEdit(m)}
                          className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(m.id)}
                          className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminMenu;
import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Ban, CheckCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
/* Dummy Data */
const usersData = Array.from({ length: 50 }, (_, i) => ({
  id: 101 + i,
  name: `User ${i + 1}`,
  role: i % 2 === 0 ? "Customer" : "Operator",
  mobile: `+91 9876543${100 + i}`,
  email: `user${i + 1}@example.com`,
  status: i % 2 === 0 ? "Active" : "Inactive",
}));

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState(usersData);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const entriesPerPage = 10;
  
  

  /* 🔍 FILTER LOGIC */
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile.includes(search);

    const matchRole = roleFilter ? u.role === roleFilter : true;
    const matchStatus = statusFilter ? u.status === statusFilter : true;

    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);

  /* Toggle Status */
  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
          : u,
      ),
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">
      {/*Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">User Management</h2>

          <button
           onClick={() => navigate("/adduser")}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            + Add User
          </button>
        </div>

        {/* 🔍 Filters */}
        <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow border border-blue-100">
          {/* Search */}
          <div className="flex items-center border border-blue-200 rounded-lg px-3 py-2 w-64 bg-white focus-within:ring-2 focus-within:ring-blue-400">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search name or mobile..."
              className="w-full outline-none text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-400"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="Operator">Operator</option>
          </select>

          {/* Status Filter */}
          <select
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-400"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* 🔥 Table */}
      <div className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-blue-50 text-gray-700 uppercase text-xs">
            <tr>
              {[
                "ID",
                "Name",
                "Role",
                "Mobile",
                "Email",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left border border-blue-100"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/40 transition">
                <td className="px-4 py-3 border border-blue-100">{user.id}</td>

                <td className="px-4 py-3 border border-blue-100 font-medium text-blue-600 hover:underline cursor-pointer">
                  {user.name}
                </td>

                <td className="px-4 py-3 border border-blue-100">
                  {user.role}
                </td>
                <td className="px-4 py-3 border border-blue-100">
                  {user.mobile}
                </td>
                <td className="px-4 py-3 border border-blue-100">
                  {user.email}
                </td>

                <td className="px-4 py-3 border border-blue-100">
                  <button
                    onClick={() => toggleStatus(user.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                      user.status === "Active"
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {user.status === "Active" ? (
                      <>
                        <CheckCircle size={14} /> Active
                      </>
                    ) : (
                      <>
                        <Ban size={14} /> Inactive
                      </>
                    )}
                  </button>
                </td>

                <td className="px-4 py-3 border border-blue-100">
                  <div className="flex gap-2">
                    <button className="p-2 rounded hover:bg-blue-100 text-blue-600 transition">
                      <Pencil size={18} />
                    </button>
                    <button className="p-2 rounded hover:bg-yellow-100 text-yellow-600 transition">
                      <Ban size={18} />
                    </button>
                    <button className="p-2 rounded hover:bg-red-100 text-red-600 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 text-sm border-t border-blue-100 bg-gray-50">
          <p>
            Showing {indexOfFirst + 1} to{" "}
            {Math.min(indexOfLast, filteredUsers.length)} of{" "}
            {filteredUsers.length}
          </p>

          <div className="flex gap-2">
            <button
              className="px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "border border-blue-200 hover:bg-blue-50"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

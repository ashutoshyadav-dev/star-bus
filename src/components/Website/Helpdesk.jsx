import { useState, useEffect } from "react";
import banner from "../../assets/banner.png";
import Navbar from "../Website/Navbar";
import Breadcrumb from "../Website/Breadcrumb";
import { FaPhoneAlt, FaSearch, FaHeadset, FaEnvelope } from "react-icons/fa";
import { cmsApi } from "../../api/cms";

function HelpDesk() {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  
  const stationId = 1;

  useEffect(() => {
    fetchContact();
  }, []);

  const fetchContact = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await cmsApi.getContactByStationId(stationId);
      const data = res?.data?.data;

      if (!data) {
        throw new Error("No contacts found for this station");
      }

      // backend might return array or single object
      const formatted = Array.isArray(data)
        ? data.map((item) => ({
            id: item.id,
            stationName: item.name || "Unknown Station",
            contactNumber: item.contactNumber || "N/A",
            email: item.email || "N/A",
          }))
        : [
            {
              id: data.id,
              stationName: data.name || "Unknown Station",
              contactNumber: data.contactNumber || "N/A",
              email: data.email || "N/A",
            },
          ];

      setContacts(formatted);
      setFilteredContacts(formatted);
    } catch (err) {
      console.error(err);
      setError("Unable to load contacts. Please try again later.");
      setContacts([]);
      setFilteredContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!search.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter((item) =>
      item.stationName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO */}
      <div className="relative h-[300px] flex items-center px-10 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${banner})` }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10">
          <h1 className="text-5xl font-bold">
            Help <span className="text-yellow-400">Desk</span>
          </h1>
          <p className="mt-2 text-gray-200">Station contact directory</p>
        </div>
      </div>

      <Breadcrumb title="Help Desk" />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">

          {/* LEFT PANEL */}
          <div className="bg-gradient-to-br from-green-600 to-green-900 text-white rounded-2xl shadow-xl p-6 h-fit">
            <div className="flex items-center gap-3 mb-5">
              <FaHeadset className="text-3xl text-yellow-300" />
              <h2 className="text-xl font-bold">Support Center</h2>
            </div>
            <p className="text-sm text-white/80 mb-6">
              24/7 help for booking & station queries
            </p>

            {/* Sample single contact */}
            <div className="space-y-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <p className="text-xs text-yellow-300">Helpline</p>
                <p className="font-semibold text-lg">+1 234 567 890</p> {/* replace with your number */}
              </div>
              <div className="bg-white/10 p-3 rounded-lg">
                <p className="text-xs text-yellow-300">Email</p>
                <div className="flex flex-col gap-1 text-sm">
                  <span>
                    <FaEnvelope /> support@example.com {/* replace with your email */}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Station Contacts</h2>
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search station..."
                  className="border px-4 py-2 rounded-lg w-[250px]"
                />
                <button
                  onClick={handleSearch}
                  className="bg-green-600 text-white px-4 rounded-lg"
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-10 text-gray-500">
                Loading contacts...
              </div>
            ) : filteredContacts.length > 0 ? (
              <table className="w-full border rounded-lg overflow-hidden">
                <thead className="bg-green-50 text-left">
                  <tr>
                    <th className="p-4">Station</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4 font-medium">{item.stationName}</td>
                      <td className="p-4 text-green-700 flex items-center gap-2">
                        <FaPhoneAlt /> {item.contactNumber}
                      </td>
                      <td className="p-4 text-gray-600">{item.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No contacts found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpDesk;
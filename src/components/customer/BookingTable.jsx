import { useNavigate } from "react-router-dom";

export default function BookingTable() {
  const navigate = useNavigate();

  const bookings = [
    {
      pnr: "APSU5456",
      route:"XYZ → Guwahati",
      date: "25 May, 2025",
      seats: "A1, A2",
      amount: "₹ 2,400",
      status: "Confirmed",
    },
    {
      pnr: "APSU5455",
      route: "Naharlagun → Tezpur",
      date: "18 May, 2025",
      seats: "B3, B4",
      amount: "₹ 1,800",
      status: "Completed",
    },
    {
      pnr: "APSU5454",
      route: "Itanagar → Dibrugarh ",
      date: "10 May, 2025",
      seats: "C1",
      amount: "₹ 900",
      status: "Cancelled",
    },
  ];

  const getStatusStyle = (status) => {
    if (status === "Confirmed") return "bg-green-100 text-green-600";
    if (status === "Completed") return "bg-blue-100 text-blue-600";
    if (status === "Cancelled") return "bg-red-100 text-red-600";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">

        {/* Header */}
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="p-3">PNR</th>
            <th className="p-3">Route</th>
            <th className="p-3">Date</th>
            <th className="p-3">Seats</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {bookings.map((item, index) => (
            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">

              <td className="p-3 font-medium">{item.pnr}</td>
              <td className="p-3">{item.route}</td>
              <td className="p-3">{item.date}</td>
              <td className="p-3">{item.seats}</td>
              <td className="p-3">{item.amount}</td>

              <td className="p-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(item.status)}`}
                >
                  {item.status}
                </span>
              </td>

              <td className="p-3 text-center">
                <button
                  onClick={() => navigate(`/ticket/${item.pnr}`)}
                  className="text-orange-500 hover:underline"
                >
                  View
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
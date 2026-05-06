import { useState } from "react";

export default function Helpdesk() {
  const [complaints, setComplaints] = useState([
    {
      id: "#CMP1034",
      text: "Refund not received",
      date: "20 May, 2026",
      status: "Open",
    },
    {
      id: "#CMP1033",
      text: "Bus delay on 10 May",
      date: "18 May, 2026",
      status: "In Progress",
    },
    {
      id: "#CMP1032",
      text: "Seat not comfortable",
      date: "10 May, 2026",
      status: "Closed",
    },
  ]);

  //  form states
  const [issueType, setIssueType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  //  submit function
  const handleSubmit = (e) => {
    e.preventDefault();

    const newComplaint = {
      id: "#CMP" + Math.floor(1000 + Math.random() * 9000),
      text: subject,
      date: new Date().toLocaleDateString(),
      status: "Open",
    };

    setComplaints([newComplaint, ...complaints]);

    // reset form
    setIssueType("");
    setSubject("");
    setDescription("");
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 overflow-hidden">

      {/* TOP HEADING */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">
          Helpdesk & Support
        </h2>
        <p className="text-sm text-gray-500">
          Raise complaints and track your issues
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-2  gap-4 flex-1 overflow-hidden">

        {/* LEFT */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col">
          <h2 className="font-semibold mb-3">Raise a Complaint</h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-3 flex-1 flex flex-col"
          >

            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm"
            >
              <option value="">Select Issue Type</option>
              <option>Refund</option>
              <option>Delay</option>
              <option>Seat Issue</option>
            </select>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              className="w-full border p-2 border-gray-300 rounded text-sm"
              required
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue..."
              className="w-full border p-2 rounded border-gray-300 text-sm flex-1 resize-none"
              required
            ></textarea>

            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-2 rounded text-sm hover:bg-orange-600"
            >
              Submit Complaint
            </button>

          </form>
        </div>

        {/* RIGHT */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col overflow-hidden">

          <h3 className="font-semibold mb-3">Your Complaints</h3>

          {/* SCROLL ONLY INSIDE LIST */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">

            {complaints.map((c) => (
              <div
                key={c.id}
                className="border p-3 rounded border-gray-300 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-sm">{c.id}</p>
                  <p className="text-xs text-gray-500">{c.text}</p>
                  <p className="text-xs text-gray-400">{c.date}</p>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    c.status === "Open"
                      ? "bg-green-100 text-green-700"
                      : c.status === "In Progress"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}

          </div>

          <button className="mt-3 bg-green-900 text-white py-2 rounded text-sm">
            View All Complaints
          </button>

        </div>

      </div>
    </div>
  );
}
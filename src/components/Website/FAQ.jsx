import { useState } from "react";
import faqImg from "../../assets/faq.png";

function FAQ() {
  const [activeTab, setActiveTab] = useState("booking");

  const data = {
    booking: [
      {
        q: "What documents do I need?",
        a: "Valid driving license, Aadhar card and address proof are required for booking.",
      },
      {
        q: "Is fuel included in the price?",
        a: "No, fuel is not included. The car will be provided with a full tank.",
      },
      {
        q: "Can I extend my rental period?",
        a: "Yes, you can extend based on availability by contacting us in advance.",
      },
    ],
    cancellation: [
      {
        q: "How can I cancel my ticket?",
        a: "Go to bookings and cancel.",
      },
    ],
    refund: [
      {
        q: "When will I get refund?",
        a: "Within 5-7 days.",
      },
    ],
    payment: [
      {
        q: "Payment methods?",
        a: "UPI, Card, Net Banking.",
      },
    ],
  };

  const tabs = ["booking", "cancellation", "refund", "payment"];

  return (
    <div className="py-16 px-10 bg-[#f3f6f9]">

      {/* Heading */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-500 text-sm">
          Everything you need to know
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-10 flex-wrap">

        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm capitalize font-medium transition
              ${
                activeTab === tab
                  ? tab === "booking"
                    ? "bg-yellow-400 text-black"
                    : tab === "refund"
                    ? "bg-orange-500 text-white"
                    : "bg-[#1f3c4d] text-white"
                  : "bg-[#2c4a5a] text-white"
              }`}
          >
            {tab}
          </button>
        ))}

      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-10 items-center">

        {/* LEFT */}
        <div className="space-y-4">

          {data[activeTab].map((item, index) => (
            <div
              key={index}
              className="bg-white p-5 rounded-xl shadow-sm border"
            >
              <h3 className="font-semibold text-gray-800">
                {item.q}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {item.a}
              </p>
            </div>
          ))}

        </div>

        {/* RIGHT IMAGE */}
        <div className="flex justify-center">
          <img
            src={faqImg}
            alt="faq"
            className="w-64 md:w-80"
          />
        </div>

      </div>
    </div>
  );
}

export default FAQ;
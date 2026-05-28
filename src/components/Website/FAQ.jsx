import { useState, useEffect } from "react";
import { cmsApi } from "../../api/cms";
import faqImg from "../../assets/faq.png";

const TABS = ["booking", "cancellation", "refund", "payment"];

const TAB_STYLE = {
  booking:      "bg-yellow-400 text-black",
  cancellation: "bg-[#1f3c4d] text-white",
  refund:       "bg-orange-500 text-white",
  payment:      "bg-[#1f3c4d] text-white",
};

function FAQ() {
  const [activeTab, setActiveTab] = useState("booking");
  const [faqMap,    setFaqMap]    = useState({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    cmsApi.getAllFaqs()
      .then((res) => {
        const all = res.data?.data ?? res.data ?? [];
        // group by category
        const map = {};
        all.forEach((f) => {
          const cat = f.category?.toLowerCase();
          if (!map[cat]) map[cat] = [];
          map[cat].push(f);
        });
        setFaqMap(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const items = faqMap[activeTab] ?? [];

  return (
    <div className="py-16 px-10 bg-[#f3f6f9]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-500 text-sm">Everything you need to know</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-10 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm capitalize font-medium transition
              ${activeTab === tab ? TAB_STYLE[tab] : "bg-[#2c4a5a] text-white"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-gray-400 text-sm">No FAQs in this category yet.</p>
          ) : (
            items.map((item) => (
              <div key={item.faqId} className="bg-white p-5 rounded-xl shadow-sm border">
                <h3 className="font-semibold text-gray-800">{item.question}</h3>
                <p className="text-sm text-gray-500 mt-2">{item.answer}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-center">
          <img src={faqImg} alt="faq" className="w-64 md:w-80" />
        </div>
      </div>
    </div>
  );
}

export default FAQ;
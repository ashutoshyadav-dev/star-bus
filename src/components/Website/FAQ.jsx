import { useState, useEffect } from "react";
import { cmsApi } from "../../api/cms";
import faqImg from "../../assets/faq.png";

const TAB_ORDER = ["booking", "payment", "cancellation", "refund", "account", "travel", "grievance"];

// One clear active style for every tab; inactive tabs get a visible hover (item 19)
const ACTIVE_TAB = "bg-yellow-400 text-black shadow-md scale-105";
const INACTIVE_TAB = "bg-[#2c4a5a] text-white hover:bg-[#3b6176]";

// Same order the admin panel uses: position, then id as the tie-breaker (item 18)
const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.faqId ?? 0) - (b.faqId ?? 0);

function FAQ() {
  const [activeTab, setActiveTab] = useState("booking");
  const [faqMap, setFaqMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cmsApi.getAllFaqs()
      .then((res) => {
        const all = res.data?.data ?? res.data ?? [];
        const map = {};
        all.forEach((f) => {
          const cat = f.category?.toLowerCase();
          if (!cat) return;
          if (!map[cat]) map[cat] = [];
          map[cat].push(f);
        });
        Object.values(map).forEach((list) => list.sort(byPosition));
        setFaqMap(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Tabs follow the categories that actually have FAQs (known ones first, in a fixed order)
  const tabs = [
    ...TAB_ORDER.filter((t) => faqMap[t]),
    ...Object.keys(faqMap).filter((t) => !TAB_ORDER.includes(t)),
  ];
  const currentTab = tabs.includes(activeTab) ? activeTab : tabs[0];
  const items = faqMap[currentTab] ?? [];

  return (
    <div className="py-16 px-10 bg-[#f3f6f9]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Frequently Asked Questions</h2>
        <p className="text-gray-600 text-sm">Everything you need to know</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-10 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-pressed={currentTab === tab}
            className={`px-5 py-2 rounded-full text-sm capitalize font-medium transition
              ${currentTab === tab ? ACTIVE_TAB : INACTIVE_TAB}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500 text-sm">No FAQs in this category yet.</p>
          ) : (
            items.map((item) => (
              <div key={item.faqId} className="bg-white p-5 rounded-xl shadow-sm border">
                <h3 className="font-semibold text-gray-800">{item.question}</h3>
                <p className="text-sm text-gray-600 mt-2">{item.answer}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-center">
          <div className="w-64 h-64 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
            <img src={faqImg} alt="FAQ" className="object-contain w-25 h-25 md:w-80 md:h-80" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQ;

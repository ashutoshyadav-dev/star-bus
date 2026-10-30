import { useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import { cmsApi } from "../../api/cms";

const CATEGORY_ORDER = ["booking", "payment", "cancellation", "refund", "account", "travel", "grievance"];
const CATEGORY_LABEL = {
  booking: "Booking",
  payment: "Payment",
  cancellation: "Cancellation",
  refund: "Refund",
  account: "Login & Account",
  travel: "Travel",
  grievance: "Grievance",
};
const labelOf = (c) => CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1);

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    document.title = "FAQs | APSTS";
    cmsApi
      .getAllFaqs()
      .then((res) => setFaqs(res.data?.data ?? res.data ?? []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const present = [...new Set(faqs.map((f) => f.category?.toLowerCase()).filter(Boolean))];
    return [
      ...CATEGORY_ORDER.filter((c) => present.includes(c)),
      ...present.filter((c) => !CATEGORY_ORDER.includes(c)),
    ];
  }, [faqs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs
      .filter((f) => category === "all" || f.category?.toLowerCase() === category)
      .filter((f) => !q || f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [faqs, query, category]);

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa]">
      <div className="bg-gradient-to-r from-[#072235] via-[#0b3240] to-[#0d4a2f] px-6 pt-28 pb-12 text-white sm:px-10">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Frequently Asked <span className="text-green-400">Questions</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Answers about booking, payment, cancellation, refunds, your account and grievances.
        </p>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, e.g. refund, OTP, seat hold"
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#0F3D2E]"
            aria-label="Search FAQs"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                category === c ? "bg-[#0F3D2E] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {c === "all" ? "All" : labelOf(c)}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {!loading && failed && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load the FAQs right now. Please try again later.
            </p>
          )}
          {!loading && !failed && visible.length === 0 && (
            <p className="text-sm text-gray-500">No questions match your search.</p>
          )}

          {visible.map((f) => {
            const open = openId === f.faqId;
            return (
              <div key={f.faqId} className="rounded-xl border bg-white shadow-sm">
                <button
                  onClick={() => setOpenId(open ? null : f.faqId)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-gray-800">{f.question}</span>
                  <FaChevronDown className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} size={12} />
                </button>
                {open && (
                  <div className="border-t px-5 py-4 text-sm leading-6 text-gray-600">
                    <p>{f.answer}</p>
                    <span className="mt-3 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-500">
                      {labelOf(f.category?.toLowerCase() ?? "")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Still need help?{" "}
          <Link to="/home/helpdesk" className="font-semibold text-[#0F3D2E] hover:underline">
            Visit the Help Desk
          </Link>{" "}
          or{" "}
          <Link to="/home/contact" className="font-semibold text-[#0F3D2E] hover:underline">
            contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

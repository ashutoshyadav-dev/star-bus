import banner from "../../../assets/banner.png";
import Breadcrumb from "../../Website/Breadcrumb";
import { FaInfoCircle, FaMoneyBillWave, FaCheckCircle } from "react-icons/fa";

const DEDUCTION_COLOR = {
  green:  "text-green-600",
  orange: "text-orange-500",
  red:    "text-red-500",
};

export default function PolicyTemplate({ page }) {
  const c = page?.content ?? {};

  return (
    <div className="w-full bg-[#f5f7fa] min-h-screen">
    

      <div className="relative h-[320px] flex items-center px-10 pt-20 text-white">
        <div className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-bold">
            {page?.title?.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-green-400">
              {page?.title?.split(" ").slice(-1)}
            </span>
          </h1>
          <p className="mt-2 text-gray-200">{page?.subtitle}</p>
        </div>
      </div>

      <Breadcrumb title={page?.title ?? ""} />

      <div className="max-w-6xl px-6 py-12 mx-auto space-y-8">

        {/* Refund info notice */}
        {c.refundInfo && (
          <div className="p-6 border-l-4 border-green-500 shadow-md bg-white rounded-2xl">
            <div className="flex items-start gap-4">
              <FaInfoCircle className="mt-1 text-3xl text-green-600 shrink-0" />
              <div>
                <h2 className="mb-2 text-xl font-bold text-gray-800">
                  Refund Information
                </h2>
                <p className="text-gray-600">{c.refundInfo}</p>
              </div>
            </div>
          </div>
        )}

        {/* Charges table */}
        {c.chargesTable?.rows?.length > 0 && (
          <div className="overflow-hidden bg-white shadow-md rounded-2xl">
            <div className="flex items-center gap-3 px-6 py-4 text-white bg-green-600">
              <FaMoneyBillWave />
              <h2 className="text-lg font-semibold">
                {c.chargesTable.heading ?? "Charges"}
              </h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">Period</th>
                  <th className="px-6 py-4 text-left">Deduction</th>
                </tr>
              </thead>
              <tbody>
                {c.chargesTable.rows.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-6 py-4">{row.period}</td>
                    <td className={`px-6 py-4 font-semibold
                      ${DEDUCTION_COLOR[row.color] ?? "text-gray-800"}`}>
                      {row.deduction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Terms sections */}
        {(c.termsSections ?? []).map((section, si) => (
          <div key={si} className="p-6 bg-white shadow-md rounded-2xl">
            <h2 className="mb-6 text-xl font-bold text-gray-800">
              {section.heading}
            </h2>
            <div className="space-y-4">
              {(section.items ?? []).map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <FaCheckCircle className="mt-1 text-green-500 shrink-0" />
                  <p className="text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
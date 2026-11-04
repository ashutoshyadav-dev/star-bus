import { formatINR } from "../../utils/money";

/**
 * One fare breakdown for the whole app (seat page, booking details, counter).
 * Accepts either a BookingResponse or the /bookings/quote FareBreakdown.
 * base − concession + reservation fee + convenience fee + GST − wallet discount = total
 */
export default function FareSummary({ f, title = "Fare Breakdown", dark = true }) {
  if (!f) return null;
  const n = (v) => Number(v ?? 0);
  const base = n(f.baseFareTotal);
  const disc = n(f.concessionTotal ?? f.concessionDiscountTotal);
  const resv = n(f.reservationFeeTotal);
  const conv = n(f.convenienceFee);
  const gst = n(f.gst ?? f.gstAmount);
  const wallet = n(f.walletDiscount);
  const total = n(f.total ?? f.totalAmountPaid);

  const muted = dark ? "text-gray-400" : "text-gray-600";
  const good = dark ? "text-green-400" : "text-green-700";
  const Row = ({ l, v, neg }) => (
    <div className={`flex justify-between ${neg ? good : muted}`}>
      <span>{l}</span>
      <span>{neg ? "- " : ""}{formatINR(v)}</span>
    </div>
  );

  return (
    <div
      className={`p-4 mb-4 text-sm border rounded-xl space-y-1.5 ${
        dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
      }`}
    >
      <h4 className={`mb-2 font-medium ${dark ? "text-gray-300" : "text-gray-700"}`}>{title}</h4>
      <Row l="Base Fare" v={base} />
      {disc > 0 && <Row l="Concession Discount" v={disc} neg />}
      {resv > 0 && <Row l="Reservation Fee" v={resv} />}
      {conv > 0 && <Row l="Convenience Fee" v={conv} />}
      {gst > 0 && <Row l="GST" v={gst} />}
      {wallet > 0 && <Row l="Wallet Discount" v={wallet} neg />}
      <div
        className={`flex justify-between pt-2 mt-2 font-semibold border-t ${
          dark ? "text-white border-white/10" : "text-gray-900 border-gray-200"
        }`}
      >
        <span>Total Amount</span>
        <span className={good}>{formatINR(total)}</span>
      </div>
    </div>
  );
}

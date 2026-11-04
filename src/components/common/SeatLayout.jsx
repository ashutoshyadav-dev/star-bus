const COLORS = {
  available: "bg-white border-gray-300 text-gray-700 hover:border-green-500",
  selected:  "bg-green-600 border-green-600 text-white",
  booked:    "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed",
  locked:    "bg-amber-200 border-amber-300 text-amber-800 cursor-not-allowed",
  ladies:    "bg-pink-50 border-pink-300 text-pink-700 hover:border-pink-500",
  driver:    "bg-slate-700 border-slate-700 text-white cursor-not-allowed",
};

export default function SeatLayout({ seats, selectedIds, onToggle, disabled }) {
  if (!seats?.length) return <p className="text-sm text-gray-500">No seats to show.</p>;
  const maxRow = Math.max(...seats.map((s) => s.rowNumber ?? 0));
  const maxCol = Math.max(...seats.map((s) => s.colNumber ?? 0));
  const nonLast = new Set(seats.filter((s) => s.rowNumber < maxRow).map((s) => s.colNumber));
  let aisleAfter = Math.floor(maxCol / 2);
  for (let c = 2; c < maxCol; c++) if (!nonLast.has(c)) { aisleAfter = c; break; }

  const typeOf = (s) => {
    if (selectedIds.includes(s.id)) return "selected";
    const st = (s.seatStatus ?? "").toLowerCase();
    if (st === "booked") return "booked";
    if ((st === "locked" || st === "hold") && !s.heldByMe) return "locked";
    if (s.isDriverSeat) return "driver";
    return s.isLadiesQuota ? "ladies" : "available";
  };

  return (
    <div>
      <div className="mx-auto w-fit rounded-3xl border-2 border-gray-300 bg-gray-50 p-4">
        <div className="mb-3 flex justify-end text-xs text-gray-500">🛞 Driver</div>
        <div className="space-y-2">
          {Array.from({ length: maxRow }, (_, ri) => (
            <div key={ri} className="flex items-center gap-2">
              {Array.from({ length: maxCol }, (_, ci) => {
                const seat = seats.find((s) => s.rowNumber === ri + 1 && s.colNumber === ci + 1);
                const gap = ci + 1 === aisleAfter ? "mr-6" : "";
                if (!seat) return <div key={ci} className={`h-10 w-10 ${gap}`} />;
                const t = typeOf(seat);
                const blocked = t === "booked" || t === "locked" || t === "driver" || disabled;
                return (
                  <button key={ci} type="button" disabled={blocked && t !== "selected"} title={`Seat ${seat.seatLabel} – ${t}`}
                          onClick={() => onToggle(seat)}
                          className={`h-10 w-10 rounded-md border text-[11px] font-semibold transition ${COLORS[t]} ${gap}`}>
                    {seat.seatLabel}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-gray-600">
        {[["available", "Available"], ["selected", "Selected"], ["locked", "Held by someone"], ["booked", "Booked"], ["ladies", "Ladies"]].map(([k, l]) => (
          <span key={k} className="flex items-center gap-1"><i className={`inline-block h-3 w-3 rounded border ${COLORS[k].split(" hover")[0]}`} />{l}</span>
        ))}
      </div>
    </div>
  );
}
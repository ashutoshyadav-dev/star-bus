import { useEffect, useMemo, useRef, useState } from "react";

export default function StationSelect({ stations, value, onChange, exclude, placeholder = "Select station",
                                        disabled, icon = null, className = "", error }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const box = useRef(null);

  const selected = stations.find((s) => String(s.id) === String(value));
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return stations.filter((s) => String(s.id) !== String(exclude ?? "") && (!t || s.name.toLowerCase().includes(t)));
  }, [stations, q, exclude]);

  useEffect(() => { setHi(0); }, [q, open]);
  useEffect(() => {
    const off = (e) => { if (box.current && !box.current.contains(e.target)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, []);

  const pick = (s) => { onChange(String(s.id)); setOpen(false); setQ(""); };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (open && list[hi]) pick(list[hi]); }   // commit ONLY on Enter
    else if (e.key === "Escape") { setOpen(false); setQ(""); }
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      <div className={`flex items-center gap-2 w-full ${error ? "ring-1 ring-red-400 rounded-full" : ""}`}>
        {icon}
        <input
          type="text" disabled={disabled} autoComplete="off" role="combobox" aria-expanded={open}
          value={open ? q : selected?.name ?? ""}
          placeholder={selected && !open ? selected.name : placeholder}
          onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}   // typing only FILTERS, never selects
          onKeyDown={onKey}
          className="w-full text-sm bg-transparent outline-none text-gray-700"
        />
      </div>
      {open && (
        <ul className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg text-sm text-gray-800">
          {list.length === 0 && <li className="px-3 py-2 text-gray-400">No station found</li>}
          {list.map((s, i) => (
            <li key={s.id} onMouseDown={(e) => { e.preventDefault(); pick(s); }} onMouseEnter={() => setHi(i)}
                className={`cursor-pointer px-3 py-2 ${i === hi ? "bg-green-50" : ""} ${String(s.id) === String(value) ? "font-semibold" : ""}`}>
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
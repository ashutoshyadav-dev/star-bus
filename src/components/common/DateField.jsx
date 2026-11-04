import { useRef, useState, useEffect } from "react";
import { isoToDMY, dmyToISO } from "../../utils/dateUtils";

/** Text input "DD/MM/YYYY" (4-digit year enforced) + native calendar popup. value/onChange use ISO yyyy-mm-dd. */
export default function DateField({ value, onChange, min, max, error, placeholder = "DD/MM/YYYY", className = "", disabled }) {
  const [text, setText] = useState(isoToDMY(value));
  const picker = useRef(null);
  useEffect(() => { setText(isoToDMY(value)); }, [value]);

  const mask = (raw) => {
    const d = raw.replace(/\D/g, "").slice(0, 8);                          // max 8 digits → year can only be 4 digits
    return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  const handle = (e) => {
    const t = mask(e.target.value);
    setText(t);
    onChange(t.length === 10 ? dmyToISO(t) : "");                          // "" until a complete, real date
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input type="text" inputMode="numeric" placeholder={placeholder} value={text} onChange={handle}
             disabled={disabled} maxLength={10} aria-invalid={!!error}
             className="w-full text-sm bg-transparent outline-none text-gray-700" />
      <button type="button" disabled={disabled} onClick={() => picker.current?.showPicker?.()}
              className="text-gray-400 hover:text-gray-600" aria-label="Open calendar">📅</button>
      <input ref={picker} type="date" tabIndex={-1} min={min} max={max} value={value || ""}
             onChange={(e) => onChange(e.target.value)}
             className="absolute opacity-0 pointer-events-none w-0 h-0" />
    </div>
  );
}
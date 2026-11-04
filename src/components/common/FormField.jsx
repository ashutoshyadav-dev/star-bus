export default function FormField({ label, required, error, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-gray-600">
          {label}{required && <span className="text-red-500" aria-hidden="true"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
export const inputCls = (err) =>
  `w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F3D2E] ${err ? "border-red-400" : "border-gray-300"}`;

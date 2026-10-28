import { RefreshCw } from "lucide-react";

export default function CaptchaBox({ image, value, onChange, onRefresh, loading }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-14 w-[190px] rounded border border-gray-300 bg-white overflow-hidden flex items-center justify-center">
          {image ? (
            <img src={image} alt="captcha" className="h-full w-full select-none" draggable={false} />
          ) : (
            <span className="text-xs text-gray-400">{loading ? "Loading…" : "Unavailable"}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          title="New captcha"
          className="p-2 rounded border border-gray-300 hover:bg-gray-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        onPaste={(e) => e.preventDefault()}
        placeholder="Enter the digits shown above"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
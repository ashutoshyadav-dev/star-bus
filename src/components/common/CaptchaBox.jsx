// import { RefreshCw } from "lucide-react";

// export default function CaptchaBox({ image, value, onChange, onRefresh, loading }) {
//   return (
//     <div className="space-y-2">
//       <div className="flex items-center gap-2">
//         <div className="h-14 w-[190px] rounded border border-gray-300 bg-white overflow-hidden flex items-center justify-center">
//           {image ? (
//             <img src={image} alt="captcha" className="h-full w-full select-none" draggable={false} />
//           ) : (
//             <span className="text-xs text-gray-400">{loading ? "Loading…" : "Unavailable"}</span>
//           )}
//         </div>
//         <button
//           type="button"
//           onClick={onRefresh}
//           title="New captcha"
//           className="p-2 rounded border border-gray-300 hover:bg-gray-50"
//         >
//           <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
//         </button>
//       </div>
//       <input
//         type="text"
//         inputMode="numeric"
//         autoComplete="off"
//         maxLength={8}
//         value={value}
//         onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
//         onPaste={(e) => e.preventDefault()}
//         placeholder="Enter the digits shown above"
//         className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
//       />
//     </div>
//   );
// }




import { RefreshCw } from "lucide-react";

export default function CaptchaBox({
  image,
  value,
  onChange,
  onRefresh,
  loading,
}) {
  const preventInteraction = (e) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* CAPTCHA Image Container */}
        <div
          className="h-14 w-[190px] rounded border border-gray-300 bg-white overflow-hidden flex items-center justify-center select-none"
          draggable={false}
          onDragStart={preventInteraction}
          onSelectStart={preventInteraction}
          onContextMenu={preventInteraction}
        >
          {image ? (
            <img
              src={image}
              alt="CAPTCHA"
              draggable={false}
              onDragStart={preventInteraction}
              onContextMenu={preventInteraction}
              className="h-full w-full select-none pointer-events-none"
            />
          ) : (
            <span className="text-xs text-gray-400 select-none">
              {loading ? "Loading…" : "Unavailable"}
            </span>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          title="New captcha"
          disabled={loading}
          className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* CAPTCHA Answer Input */}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={8}
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, ""))
        }
        onPaste={(e) => e.preventDefault()}
        placeholder="Enter the digits shown above"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

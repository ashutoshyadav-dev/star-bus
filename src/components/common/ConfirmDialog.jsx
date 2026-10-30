import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaExclamationTriangle, FaInfoCircle, FaQuestionCircle } from "react-icons/fa";

/**
 * Promise-based replacement for window.confirm().
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Delete route?", message: "...", tone: "danger", confirmText: "Delete" }))) return;
 *
 * tone: "danger" | "warning" | "info"
 * Optional: requireReason (shows a textarea; the promise resolves to the entered text instead of `true`).
 */
const ConfirmContext = createContext(null);

const TONES = {
  danger:  { icon: FaExclamationTriangle, ring: "bg-red-100 text-red-600",    btn: "bg-red-600 hover:bg-red-700" },
  warning: { icon: FaExclamationTriangle, ring: "bg-amber-100 text-amber-600", btn: "bg-amber-600 hover:bg-amber-700" },
  info:    { icon: FaInfoCircle,          ring: "bg-blue-100 text-blue-600",   btn: "bg-[#0F3D2E] hover:bg-[#0c2e22]" },
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { options, resolve }
  const [reason, setReason] = useState("");
  const confirmBtnRef = useRef(null);

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        setReason("");
        setState({ options, resolve });
      }),
    []
  );

  const close = useCallback(
    (result) => {
      state?.resolve(result);
      setState(null);
    },
    [state]
  );

  useEffect(() => {
    if (!state) return;
    confirmBtnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, close]);

  const o = state?.options ?? {};
  const tone = TONES[o.tone] ?? TONES.info;
  const Icon = o.tone ? tone.icon : FaQuestionCircle;
  const needsReason = !!o.requireReason;
  const canConfirm = !needsReason || reason.trim().length > 0;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => e.target === e.currentTarget && close(false)}
            role="presentation"
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-message"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.ring}`}>
                  <Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 id="confirm-title" className="text-base font-semibold text-gray-900">
                    {o.title ?? "Are you sure?"}
                  </h3>
                  {o.message && (
                    <p id="confirm-message" className="mt-1 whitespace-pre-line text-sm text-gray-600">
                      {o.message}
                    </p>
                  )}
                  {needsReason && (
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder={o.reasonPlaceholder ?? "Enter a reason"}
                      className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {o.cancelText ?? "Cancel"}
                </button>
                <button
                  ref={confirmBtnRef}
                  type="button"
                  disabled={!canConfirm}
                  onClick={() => close(needsReason ? reason.trim() : true)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${tone.btn}`}
                >
                  {o.confirmText ?? "Confirm"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

import { useEffect, useRef } from "react";

const BLOCKED_INPUT_TYPES = new Set([
  "insertFromPaste",
  "insertFromDrop",
  "insertFromPasteAsQuotation",
  "insertFromYank",
]);

/** Drop-in <input type="password"> that cannot receive pasted / dropped text. */
export default function PasswordInput({ type = "password", ...props }) {
  const ref = useRef(null);

  // Native listener: catches mobile long-press "Paste" which React's onPaste can miss.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onBeforeInput = (e) => {
      if (BLOCKED_INPUT_TYPES.has(e.inputType)) e.preventDefault();
    };
    el.addEventListener("beforeinput", onBeforeInput);
    return () => el.removeEventListener("beforeinput", onBeforeInput);
  }, []);

  const block = (e) => e.preventDefault();

  return (
    <input
      {...props}
      ref={ref}
      type={type}
      onPaste={block}
      onDrop={block}
      onCopy={block}
      onCut={block}
      onContextMenu={block}
      onKeyDown={(e) => {
        const k = e.key.toLowerCase();
        if (((e.ctrlKey || e.metaKey) && k === "v") || (e.shiftKey && k === "insert")) {
          e.preventDefault();
        }
        props.onKeyDown?.(e);
      }}
    />
  );
}

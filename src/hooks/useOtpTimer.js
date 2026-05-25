
import { useEffect, useRef, useState } from "react";

/**
 * useOtpTimer — OTP countdown timer hook.
 *
 * @param {number} seconds - Countdown duration in seconds (default 60)
 * @returns {{ timer: number, start: () => void, reset: () => void, isRunning: boolean }}
 *
 * Usage:
 *   const { timer, start, reset, isRunning } = useOtpTimer(60);
 *
 *   // Start countdown after OTP is sent:
 *   await authApi.requestOtp(...);
 *   start();
 *
 *   // Show resend button when timer hits zero:
 *   {isRunning ? <span>Resend in {timer}s</span> : <button onClick={resend}>Resend OTP</button>}
 */
export function useOtpTimer(seconds = 60) {
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

  /** Start (or restart) the countdown. */
  const start = () => {
    clearInterval(intervalRef.current);
    setTimer(seconds);
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  /** Reset timer to zero without starting a new countdown. */
  const reset = () => {
    clearInterval(intervalRef.current);
    setTimer(0);
  };

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { timer, start, reset, isRunning: timer > 0 };
}
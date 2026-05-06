import { useState, useEffect, useRef } from "react";

/**
 * Manages an OTP countdown timer.
 * @param {number} seconds - Countdown duration in seconds (default 60)
 */
export function useOtpTimer(seconds = 60) {
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

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

  const reset = () => {
    clearInterval(intervalRef.current);
    setTimer(0);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { timer, start, reset, isRunning: timer > 0 };
}

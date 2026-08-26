import { useEffect, useState } from 'react';

// Returns seconds remaining until `deadline`, or null while `deadline` isn't
// known yet — null is deliberately distinct from 0 so callers waiting on a
// real value (e.g. before deciding whether time has already run out) don't
// briefly see a false "0 remaining" during the initial render.
export function useCountdown(deadline) {
  const [secondsLeft, setSecondsLeft] = useState(() => (
    deadline ? Math.max(0, Math.round((new Date(deadline) - Date.now()) / 1000)) : null
  ));

  useEffect(() => {
    if (!deadline) return undefined;
    setSecondsLeft(Math.max(0, Math.round((new Date(deadline) - Date.now()) / 1000)));
    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((new Date(deadline) - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return secondsLeft;
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

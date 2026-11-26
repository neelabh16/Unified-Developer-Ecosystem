import { useEffect, useState } from 'react';

function computeCountdown(endTime) {
  if (!endTime) {
    return { label: 'Live now', isLive: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const target = new Date(endTime).getTime();
  if (Number.isNaN(target)) {
    return { label: 'Live now', isLive: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const diff = target - Date.now();
  if (diff <= 0) {
    return { label: 'Live now', isLive: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const label = days > 0 ? `${days}d ${hours}h ${minutes}m` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return { label, isLive: false, days, hours, minutes, seconds };
}

export function useCountdown(endTime) {
  const [state, setState] = useState(() => ({
    endTime,
    value: computeCountdown(endTime),
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setState({ endTime, value: computeCountdown(endTime) });
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (state.endTime !== endTime) {
    return computeCountdown(endTime);
  }
  return state.value;
}

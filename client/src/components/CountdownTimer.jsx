import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

function getRemaining(endsAt) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const pad = (n) => String(n).padStart(2, '0');

export default function CountdownTimer({ endsAt, size = 'sm', onExpire }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    setRemaining(getRemaining(endsAt));
    const id = setInterval(() => {
      const next = getRemaining(endsAt);
      setRemaining(next);
      if (!next) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  if (!remaining) return null;

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-volt text-white font-mono ${
        isSmall ? 'text-[11px] px-2 py-0.5' : 'text-sm px-3 py-1.5'
      }`}
    >
      <Zap className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="currentColor" />
      {remaining.hours > 0 && `${pad(remaining.hours)}:`}
      {pad(remaining.minutes)}:{pad(remaining.seconds)}
    </div>
  );
}

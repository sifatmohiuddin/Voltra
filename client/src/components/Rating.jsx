import { Star } from 'lucide-react';

export default function Rating({ value = 0, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={i < Math.round(value) ? 'text-volt' : 'text-line'}
            fill="currentColor"
          />
        ))}
      </div>
      {typeof count === 'number' && <span className="text-xs text-ink-faint">({count})</span>}
    </div>
  );
}

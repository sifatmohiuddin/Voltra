import { Check, X, Package, Truck, ClipboardCheck, PackageCheck, Home } from 'lucide-react';

const STEPS = [
  { status: 'Placed', icon: ClipboardCheck },
  { status: 'Confirmed', icon: Check },
  { status: 'Processing', icon: Package },
  { status: 'Shipped', icon: Truck },
  { status: 'Out for Delivery', icon: PackageCheck },
  { status: 'Delivered', icon: Home },
];

export default function OrderStatusTimeline({ status, statusHistory = [] }) {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-stock-out/30 bg-stock-out/5 p-4">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-stock-out text-white shrink-0">
          <X className="w-4 h-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">Order cancelled</p>
          <p className="text-xs text-ink-muted">Contact support if this wasn&rsquo;t expected.</p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === status);
  const historyFor = (s) => statusHistory.find((h) => h.status === s)?.at;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0 sm:gap-2">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const at = historyFor(step.status);
        return (
          <div key={step.status} className="flex sm:flex-col items-start sm:items-center flex-1 gap-3 sm:gap-2">
            <div className="flex sm:flex-col items-center sm:w-full">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-colors ${
                  done ? 'bg-volt text-white' : 'bg-line text-ink-faint'
                }`}
              >
                <step.icon className="w-4 h-4" />
              </span>
              {i < STEPS.length - 1 && (
                <span className={`hidden sm:block h-0.5 flex-1 w-full mt-4 ${i < currentIndex ? 'bg-volt' : 'bg-line'}`} />
              )}
            </div>
            <div className="pb-4 sm:pb-0 sm:text-center">
              <p className={`text-xs font-medium ${done ? 'text-ink' : 'text-ink-faint'}`}>{step.status}</p>
              {at && <p className="text-[10px] text-ink-faint mt-0.5">{new Date(at).toLocaleString()}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

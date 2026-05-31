export function PendingBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="relative flex h-5 w-5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 text-[10px] font-black text-white items-center justify-center shadow-sm border border-white dark:border-slate-900">
        {count}
      </span>
    </span>
  );
}

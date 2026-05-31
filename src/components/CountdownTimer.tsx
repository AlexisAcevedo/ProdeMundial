import { useCountdown } from '../hooks/useCountdown';

export function CountdownTimer({ targetDate }: { targetDate: string | Date | number }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <span className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/5">
        Cerrado
      </span>
    );
  }

  // Calcular horas totales que faltan para decidir el color de urgencia
  const totalHours = days * 24 + hours;
  const isUrgent = totalHours === 0 && minutes < 30; // < 30 mins
  const isWarning = totalHours < 2; // < 2 horas

  let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
  let pulseClass = '';

  if (isUrgent) {
    colorClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
    pulseClass = 'animate-pulse';
  } else if (isWarning) {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
  }

  // Formato compacto
  let text: string;
  if (days > 0) {
    text = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    text = `${minutes}m ${seconds}s`;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${colorClass} ${pulseClass}`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {text}
    </span>
  );
}

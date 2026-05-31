import { useToast } from '../contexts/ToastContext';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        let icon = null;
        let colorClasses = '';

        switch (toast.type) {
          case 'success':
            icon = (
              <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            );
            colorClasses = 'border-emerald-500/20 bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100';
            break;
          case 'error':
            icon = (
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            );
            colorClasses = 'border-red-500/20 bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100';
            break;
          case 'warning':
            icon = (
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            );
            colorClasses = 'border-amber-500/20 bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100';
            break;
          default:
            icon = (
              <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            );
            colorClasses = 'border-blue-500/20 bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100';
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 ${colorClasses}`}
            role="alert"
          >
            <div className="flex gap-2.5 min-w-0">
              {icon}
              <p className="text-sm font-semibold leading-5 break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-white/5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

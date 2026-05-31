import { useState } from 'react';

interface ShareLeagueProps {
  inviteCode: string;
  leagueName: string;
}

export function ShareLeague({ inviteCode, leagueName }: ShareLeagueProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `¡Unite a mi liga "${leagueName}" en ProdeMundial para pronosticar los partidos del Mundial 2026! Código de invitación: ${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Liga ${leagueName} - ProdeMundial`,
          text: shareText,
          url: window.location.origin,
        });
      } catch (err) {
        console.error('Error al compartir', err);
      }
    } else {
      // Fallback a enlace de WhatsApp
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + window.location.origin)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-300 border ${
          copied
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-300 dark:border-white/5 dark:hover:bg-white/10'
        }`}
      >
        {copied ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            ¡Copiado!
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copiar Código
          </>
        )}
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white px-3 py-2 text-xs font-bold shadow-sm transition-all"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.028-2.014m0 0a3.001 3.001 0 112.248 4.009l-4.028 2.014m0 0a3.001 3.001 0 11-2.248-4.009zm7.843-2.782L13.5 10.5M8 13.5l-3.5 1.5" />
        </svg>
        Compartir Liga
      </button>
    </div>
  );
}

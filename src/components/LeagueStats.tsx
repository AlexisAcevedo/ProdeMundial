import { useLeagueStats, type LeagueStatItem } from '../hooks/useLeagueStats';
import { Skeleton } from './Skeleton';

interface LeagueStatsProps {
  leagueId: string;
}

export function LeagueStats({ leagueId }: LeagueStatsProps) {
  const { stats, isLoading, error } = useLeagueStats(leagueId);

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📊</span> Estadísticas y Premios
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/50 bg-white p-5 dark:border-white/5 dark:bg-fifa-card space-y-3">
              <Skeleton variant="circular" width="40px" height="40px" />
              <Skeleton width="60%" height="16px" />
              <Skeleton width="40%" height="12px" />
              <Skeleton width="80%" height="10px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-500 dark:border-red-950/20 dark:bg-red-950/5">
        Error al cargar las estadísticas de la liga.
      </div>
    );
  }

  // Si no hay estadísticas (porque no hay partidos finalizados), mostramos banner de placeholder
  if (stats.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-white/5 dark:bg-fifa-card/50">
        <span className="text-2xl mb-2 block">📊</span>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Premios y Estadísticas
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
          Los premios como "Rey del exacto" o "Mejor racha" aparecerán acá de forma automática a medida que finalicen los primeros partidos del torneo.
        </p>
      </div>
    );
  }

  // Buscar cada estadística en la lista
  const exactKing = stats.find((s) => s.metric === 'exact_king');
  const optimist = stats.find((s) => s.metric === 'optimist');
  const consistent = stats.find((s) => s.metric === 'consistent');
  const streak = stats.find((s) => s.metric === 'streak');

  const statCards: {
    id: string;
    title: string;
    description: string;
    icon: string;
    colorClass: string;
    iconBgClass: string;
    data: LeagueStatItem | undefined;
    formatValue: (val: number) => string;
  }[] = [
    {
      id: 'exact_king',
      title: 'Rey del Exacto',
      description: 'Más aciertos del marcador exacto.',
      icon: '👑',
      colorClass: 'text-amber-600 dark:text-amber-400',
      iconBgClass: 'bg-amber-100 dark:bg-amber-950/20',
      data: exactKing,
      formatValue: (val) => `${val} exacto${val !== 1 ? 's' : ''}`,
    },
    {
      id: 'streak',
      title: 'Mejor Racha',
      description: 'Más partidos seguidos sumando puntos.',
      icon: '🔥',
      colorClass: 'text-orange-600 dark:text-orange-400',
      iconBgClass: 'bg-orange-100 dark:bg-orange-950/20',
      data: streak,
      formatValue: (val) => `${val} partido${val !== 1 ? 's' : ''}`,
    },
    {
      id: 'optimist',
      title: 'El Optimista',
      description: 'Más goles totales pronosticados.',
      icon: '😎',
      colorClass: 'text-blue-600 dark:text-blue-400',
      iconBgClass: 'bg-blue-100 dark:bg-blue-950/20',
      data: optimist,
      formatValue: (val) => `${val} gol${val !== 1 ? 'es' : ''}`,
    },
    {
      id: 'consistent',
      title: 'Más Consistente',
      description: 'Menor variación en sus puntajes.',
      icon: '🎯',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      iconBgClass: 'bg-emerald-100 dark:bg-emerald-950/20',
      data: consistent,
      formatValue: (val) => `Desv. std: ${val}`,
    },
  ];

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <span>📊</span> Estadísticas y Premios
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const winnerName = card.data?.user_name || card.data?.user_email?.split('@')[0] || 'Nadie';
          const hasWinner = !!card.data;

          return (
            <div
              key={card.id}
              className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-fifa-card hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between"
            >
              {/* Orb decorativo al hover */}
              <div className="absolute -right-8 -bottom-8 w-20 h-20 bg-slate-100 dark:bg-white/5 blur-xl rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
              
              <div className="space-y-3 z-10 relative">
                {/* Cabecera de la stat con ícono */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-lg ${card.iconBgClass}`}>
                    {card.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                      {card.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* Ganador actual */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                  {hasWinner ? (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Líder actual
                      </span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block truncate">
                        {winnerName}
                      </span>
                      <span className={`text-xs font-black block mt-0.5 ${card.colorClass}`}>
                        {card.formatValue(card.data!.value)}
                      </span>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                      Sin datos
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useLeagueStandings } from '../hooks/useLeagueStandings';
import type { League, Match } from '../lib/types';
import { ShareLeague } from './ShareLeague';
import { useAuth } from '../hooks/useAuth';
import { useLeagueAdmin } from '../hooks/useLeagueAdmin';
import { useToast } from '../contexts/ToastContext';
import { StandingRowSkeleton } from './Skeleton';
import { LeagueStats } from './LeagueStats';
import { LeagueChat } from './LeagueChat';
import { MatchPredictionsModal } from './MatchPredictionsModal';

interface LeagueDetailsProps {
  league: League;
  matches: Match[];
  onBack: () => void;
}

export function LeagueDetails({ league, matches, onBack }: LeagueDetailsProps) {
  const { standings, isLoading, error } = useLeagueStandings(league.id);
  const { user } = useAuth();
  const { removeMember, deleteLeague, isLoading: isAdminActionLoading } = useLeagueAdmin();
  const { addToast } = useToast();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const isOwner = league.owner_id === user?.id;

  const handleKickMember = async (participantId: string, participantName: string) => {
    if (!window.confirm(`¿Estás seguro de que querés expulsar a ${participantName} de la liga?`)) {
      return;
    }

    try {
      await removeMember(league.id, participantId);
      addToast(`Expulsaste a ${participantName} de la liga`, 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Error al expulsar al miembro', 'error');
    }
  };

  const handleDeleteLeague = async () => {
    if (!window.confirm('¿Estás absolutamente seguro de que querés eliminar esta liga? Esta acción es irreversible.')) {
      return;
    }

    try {
      await deleteLeague(league.id);
      addToast('Liga eliminada con éxito', 'success');
      onBack();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Error al eliminar la liga', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 relative z-10">
        <button
          onClick={onBack}
          className="rounded-xl p-2.5 bg-white/50 dark:bg-white/5 text-slate-500 hover:bg-white hover:text-brand-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-all backdrop-blur-sm border border-slate-200/50 dark:border-white/5 shadow-sm"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{league.name}</h2>
          <div className="flex flex-col gap-2 mt-1">
            <div className="self-start inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
              Código de invitación: <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm tracking-wider">{league.invite_code}</span>
            </div>
            <ShareLeague inviteCode={league.invite_code} leagueName={league.name} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl relative z-10 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Tabla de Posiciones
              </h3>
            </div>
            
            {isLoading ? (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <StandingRowSkeleton />
                <StandingRowSkeleton />
                <StandingRowSkeleton />
                <StandingRowSkeleton />
                <StandingRowSkeleton />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">Error al cargar posiciones: {error.message}</div>
            ) : standings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">No hay participantes aún.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-black/20 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Pos</th>
                      <th className="px-6 py-4">Participante</th>
                      <th className="px-6 py-4 text-right">Puntos</th>
                      {isOwner && <th className="px-6 py-4 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {standings.map((participant, index) => (
                      <tr key={participant.user_id} className="group hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : index === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-transparent text-slate-400'}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {participant.avatar_url ? (
                              <img src={participant.avatar_url} alt={participant.display_name || 'Avatar'} className="h-10 w-10 rounded-xl object-cover shadow-inner border border-white/20 dark:border-white/5" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-teal/20 text-brand-600 dark:text-brand-400 font-bold shadow-inner border border-white/20 dark:border-white/5">
                                {participant.display_name?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                {participant.display_name || 'Usuario'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-block text-xl font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-lg">
                            {participant.total_points}
                          </span>
                        </td>
                        {isOwner && (
                          <td className="px-6 py-4 text-right">
                            {participant.user_id !== user?.id && (
                              <button
                                onClick={() => handleKickMember(participant.user_id, participant.display_name)}
                                disabled={isAdminActionLoading}
                                className="text-red-500 hover:text-red-400 transition-colors p-1"
                                title="Expulsar de la liga"
                              >
                                <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <LeagueChat leagueId={league.id} />
        </div>
      </div>

      <LeagueStats leagueId={league.id} />

      {/* Selector de partidos para ver predicciones */}
      <div className="glass-card rounded-2xl relative z-10 p-6 mt-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Comparar Pronósticos de la Liga
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Seleccioná un partido para ver qué pronosticó cada participante de la liga. Ojo: los pronósticos ajenos permanecen ocultos hasta 30 minutos antes del inicio.
        </p>
        <div className="max-w-md">
          <select
            onChange={(e) => {
              const match = matches.find((m) => m.id === e.target.value);
              if (match) setSelectedMatch(match);
            }}
            value={selectedMatch?.id ?? ''}
            className="w-full rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="">-- Seleccionar un partido --</option>
            {matches.map((m) => {
              const isFinished = m.status === 'finished';
              const kickoff = new Date(m.kickoff_time);
              const formattedDate = kickoff.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              return (
                <option key={m.id} value={m.id}>
                  {m.home_team} vs {m.away_team} ({isFinished ? 'Finalizado' : 'Pendiente'}) - {formattedDate}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {selectedMatch && (
        <MatchPredictionsModal
          leagueId={league.id}
          leagueName={league.name}
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {isOwner && (
        <div className="rounded-2xl border border-red-200/50 bg-red-50/50 p-6 dark:border-red-950/20 dark:bg-red-950/5 mt-8">
          <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Zona de Peligro
          </h3>
          <p className="text-xs text-red-700/80 dark:text-red-400/80 mb-4">
            Al eliminar la liga, se perderán todos los datos de clasificaciones y miembros asociados de forma permanente. Esta acción no se puede deshacer.
          </p>
          <button
            onClick={handleDeleteLeague}
            disabled={isAdminActionLoading}
            className="rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-3 px-5 text-sm transition-all shadow-md shadow-red-500/20"
          >
            {isAdminActionLoading ? 'Eliminando...' : 'Eliminar Liga Permanentemente'}
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useLongTermPredictions } from '../hooks/useLongTermPredictions';
import { getTeamFlagCode } from '../lib/teamFlags';
import "flag-icons/css/flag-icons.min.css";

const ALL_TEAMS = Array.from(new Set([
  'Argentina', 'Australia', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Brazil',
  'Cabo Verde', 'Canada', 'Colombia', 'Croatia', 'Curaçao', "Côte d'Ivoire", 'DR Congo',
  'Ecuador', 'Egypt', 'England', 'France', 'Germany', 'Ghana', 'Haiti', 'IR Iran',
  'Iraq', 'Japan', 'Jordan', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Norway',
  'Panama', 'Paraguay', 'Portugal', 'Qatar', 'Saudi Arabia', 'Scotland', 'Senegal',
  'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Tunisia', 'Türkiye',
  'USA', 'Uruguay', 'Uzbekistan', 'Czechia', 'Algeria'
])).sort();

export function LongTermPredictions() {
  const { prediction, isLoading, isLocked, savePrediction } = useLongTermPredictions();
  const [champion, setChampion] = useState('');
  const [runnerUp, setRunnerUp] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Sincronizar estado local cuando llega la predicción de la DB
  useEffect(() => {
    if (prediction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChampion(prediction.champion_team);
      setRunnerUp(prediction.runner_up_team);
    }
  }, [prediction]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-fifa-card rounded-3xl p-6 border border-slate-200/50 dark:border-white/5 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-white/10 rounded mb-4"></div>
        <div className="h-20 w-full bg-slate-200 dark:bg-white/10 rounded-2xl"></div>
      </div>
    );
  }

  const handleSave = () => {
    if (champion && runnerUp) {
      if (champion === runnerUp) {
        alert('El Campeón y Subcampeón no pueden ser el mismo equipo.');
        return;
      }
      savePrediction(champion, runnerUp);
      setIsEditing(false);
    }
  };

  const renderTeamSelector = (label: string, value: string, setValue: (val: string) => void, disabled: boolean, placeholder: string, isChampion: boolean) => (
    <div className="flex-1">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {label} {isChampion ? '🏆' : '🥈'}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          className={`w-full appearance-none rounded-2xl border ${
            isChampion ? 'border-amber-200 bg-amber-50 focus:border-amber-500 dark:bg-amber-500/10 dark:border-amber-500/20' : 'border-slate-200 bg-slate-50 focus:border-brand-500 dark:bg-white/5 dark:border-white/5'
          } px-4 py-3 pl-12 text-sm font-bold text-slate-800 outline-none transition-colors dark:text-white disabled:opacity-70`}
        >
          <option value="" disabled>{placeholder}</option>
          {ALL_TEAMS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          {value && getTeamFlagCode(value) ? (
             <span className={`fi fi-${getTeamFlagCode(value)} text-lg rounded-sm overflow-hidden`}></span>
          ) : (
             <span className="text-lg">🏳️</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-fifa-card rounded-2xl p-4 sm:p-5 border border-slate-200/50 dark:border-white/5 shadow-sm">
      <div className="flex flex-col mb-4 gap-2">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">
            Predicciones del Torneo
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pronosticá al Campeón y Subcampeón.
          </p>
        </div>
        {isLocked && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Bloqueado
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {renderTeamSelector('Campeón', champion, setChampion, isLocked || (!isEditing && !!prediction), 'Elegir...', true)}
        {renderTeamSelector('Subcampeón', runnerUp, setRunnerUp, isLocked || (!isEditing && !!prediction), 'Elegir...', false)}
      </div>

      {!isLocked && (
        <div className="mt-6 flex justify-end">
          {(!prediction || isEditing) ? (
            <button
              onClick={handleSave}
              disabled={!champion || !runnerUp}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-500 active:scale-95 disabled:opacity-50"
            >
              Guardar Predicción
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-xl border border-slate-200 dark:border-white/10 px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95"
            >
              Editar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

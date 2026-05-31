import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface ProfileModalProps {
  userId: string;
  currentName: string | null;
  currentAvatarUrl: string | null;
  onClose: () => void;
  onProfileUpdate: (name: string, avatarUrl: string) => void;
}

export function ProfileModal({
  userId,
  currentName,
  currentAvatarUrl,
  onClose,
  onProfileUpdate,
}: ProfileModalProps) {
  const [name, setName] = useState(currentName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('El nombre de perfil no puede estar vacío', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          avatar_url: avatarUrl.trim() || null,
        })
        .eq('id', userId);

      if (error) throw error;

      onProfileUpdate(name.trim(), avatarUrl.trim());
      addToast('¡Perfil actualizado con éxito!', 'success');
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Error al actualizar el perfil', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-fifa-card border border-slate-200/50 dark:border-white/5 z-10">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Editar Perfil
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Nombre en pantalla
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Leo Messi"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/5 dark:bg-white/5 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
              maxLength={30}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="profile-avatar" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              URL del Avatar
            </label>
            <input
              id="profile-avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://ejemplo.com/tu-foto.jpg"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/5 dark:bg-white/5 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
              disabled={isSubmitting}
            />
          </div>

          {avatarUrl && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-slate-400">Previsualización:</span>
              <img
                src={avatarUrl}
                alt="Avatar preview"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                }}
                className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-white/10"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-slate-100 dark:bg-white/5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition-all hover:bg-brand-500 active:scale-95 disabled:opacity-50 shadow-md shadow-brand-500/20"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

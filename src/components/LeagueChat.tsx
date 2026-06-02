import { useState, useRef, useEffect } from 'react';
import { useLeagueChat } from '../hooks/useLeagueChat';
import { useAuth } from '../hooks/useAuth';

interface LeagueChatProps {
  leagueId: string;
}

export function LeagueChat({ leagueId }: LeagueChatProps) {
  const { messages, isLoading, error, sendMessage } = useLeagueChat(leagueId);
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 140 || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(trimmed);
      setContent('');
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl relative z-10 flex flex-col h-[500px] overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-sm">
      <div className="p-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Muro de Liga (Trash Talk)
        </h3>
        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-white/5 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
          En vivo
        </span>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/5">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cargando mensajes...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">Error al cargar chat: {error.message}</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 dark:text-slate-500">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <p className="font-bold">¡Silencio en la sala!</p>
            <p className="text-xs mt-1">Escribí algo para picar a tus amigos.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0">
                  {msg.user?.avatar_url ? (
                    <img src={msg.user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-teal/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-white/5">
                      {msg.user?.display_name ? msg.user.display_name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isMe ? 'Vos' : msg.user?.display_name || 'Participante'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`mt-1 px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm border ${isMe ? 'bg-brand-600 text-white border-brand-700 rounded-tr-none' : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border-slate-200/50 dark:border-white/5 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 140))}
            placeholder="Chicanear a tus amigos..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none max-h-20 min-h-[38px] pr-12"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <span className={`absolute bottom-2 right-3 text-[10px] font-bold ${content.length >= 130 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
            {content.length}/140
          </span>
        </div>
        <button
          type="submit"
          disabled={!content.trim() || content.length > 140 || isSending}
          className="flex-shrink-0 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:bg-slate-300 dark:disabled:bg-white/5 text-white p-2.5 transition-all shadow-md shadow-brand-500/10 cursor-pointer"
        >
          <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "npm:web-push";

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Configurar web-push
webpush.setVapidDetails(
  'mailto:prodemundial@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  // Autenticación de la petición (solo el cronjob o un admin debería llamarlo)
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // 1. Buscar el próximo partido (que empiece en las próximas 2 horas)
    const { data: upcomingMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, kickoff_time')
      .eq('status', 'pending')
      .gt('kickoff_time', new Date().toISOString())
      // en un rango de ahora + 2 horas
      .lt('kickoff_time', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString())
      .order('kickoff_time', { ascending: true });

    if (matchesError) throw matchesError;
    if (!upcomingMatches || upcomingMatches.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming matches within 2 hours" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const nextMatch = upcomingMatches[0];

    // 2. Buscar usuarios que NO hayan pronosticado este partido
    // Hacemos un left join manual o una query directa
    const { data: usersWithPredictions, error: predError } = await supabase
      .from('predictions')
      .select('user_id')
      .eq('match_id', nextMatch.id);

    if (predError) throw predError;

    const predictedUserIds = usersWithPredictions.map(p => p.user_id);

    // 3. Obtener suscripciones de push de todos los usuarios que NO están en predictedUserIds
    let query = supabase.from('push_subscriptions').select('*');
    if (predictedUserIds.length > 0) {
      // not in no está soportado nativamente si el array es muy grande,
      // pero supongamos que lo es:
      query = query.not('user_id', 'in', `(${predictedUserIds.join(',')})`);
    }

    const { data: subs, error: subsError } = await query;
    if (subsError) throw subsError;

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "All users have predicted or no subs" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Enviar notificación push a esos usuarios
    let successCount = 0;
    const payload = JSON.stringify({
      title: "¡Alerta Prode Mundial! 🚨",
      body: `Faltan menos de 2 horas para el partido ${nextMatch.home_team} vs ${nextMatch.away_team}. ¡No olvides cargar tu pronóstico!`,
      icon: "/pwa-192x192.png"
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        );
        successCount++;
      } catch (err) {
        console.error(`Failed to send push to ${sub.endpoint}`, err);
        // Si el endpoint falló (ej. unsubscribe 410), podríamos borrarlo de DB
      }
    }

    return new Response(JSON.stringify({ 
      message: `Sent ${successCount} notifications successfully`,
      match: `${nextMatch.home_team} vs ${nextMatch.away_team}`
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})

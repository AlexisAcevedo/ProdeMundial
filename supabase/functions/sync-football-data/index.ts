import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Definimos las variables de entorno necesarias
const API_KEY = Deno.env.get('FOOTBALL_DATA_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Faltan variables de entorno (FOOTBALL_DATA_TOKEN, SUPABASE_URL, o SUPABASE_SERVICE_ROLE_KEY).")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // 1. Buscamos partidos que estén 'pending' pero que hayan arrancado hace más de 110 minutos
    const twoHoursAgo = new Date(Date.now() - 110 * 60 * 1000).toISOString()
    const { data: pendingMatches, error: dbError } = await supabase
      .from('matches')
      .select('id, match_number')
      .eq('status', 'pending')
      .lt('kickoff_time', twoHoursAgo)

    if (dbError) throw dbError

    // Si no hay partidos que debieran haber terminado, cortamos la ejecución para ahorrar peticiones a la API
    if (!pendingMatches || pendingMatches.length === 0) {
      return new Response(JSON.stringify({ message: "No hay partidos pendientes por finalizar. No se consumen peticiones a la API." }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // ==========================================
    // 2. CONSULTA A LA API PARA FIXTURES
    // ==========================================
    // NOTA: Acá se pasa la fecha de hoy para buscar los partidos correspondientes a la jornada
    const dateToday = new Date().toISOString().split('T')[0];
    const fixturesRes = await fetch(`https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${dateToday}&dateTo=${dateToday}`, {
      headers: {
        'X-Auth-Token': API_KEY
      }
    });
    
    const fixturesData = await fixturesRes.json();
    
    // Procesar los resultados de los fixtures y actualizar la base de datos...
    // (Lógica de update omitida por brevedad, se iteraría sobre fixturesData.matches y se haría un supabase.from('matches').update(...) )

    // ==========================================
    // 3. CONSULTA A LA API PARA STANDINGS
    // ==========================================
    // Consulta al Mundial (WC) en la temporada actual (2026)
    const standingsRes = await fetch(`https://api.football-data.org/v4/competitions/WC/standings`, {
      headers: {
        'X-Auth-Token': API_KEY
      }
    });

    const standingsData = await standingsRes.json();
    
    if (standingsData.standings && standingsData.standings.length > 0) {
      const upsertPayload = [];
      
      // La API puede devolver home/away/total. Nos quedamos con la TOTAL de la fase de grupos.
      for (const groupObj of standingsData.standings) {
        if (groupObj.type === "TOTAL" && groupObj.stage === "GROUP_STAGE") {
          // Parseamos el group name (ej: "GROUP A" -> "A")
          const groupLetter = groupObj.group ? groupObj.group.replace('GROUP ', '') : '';
          
          for (const row of groupObj.table) {
            upsertPayload.push({
              team_name: row.team.name,
              group_letter: groupLetter,
              points: row.points,
              played: row.playedGames,
              won: row.won,
              drawn: row.draw,
              lost: row.lost,
              goals_for: row.goalsFor,
              goals_against: row.goalsAgainst,
              goals_diff: row.goalDifference,
              rank: row.position,
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      // Upsert en la tabla group_standings
      if (upsertPayload.length > 0) {
        const { error: upsertError } = await supabase
          .from('group_standings')
          .upsert(upsertPayload, { onConflict: 'group_letter,team_name' });
          
        if (upsertError) throw upsertError;
      }
    }

    return new Response(JSON.stringify({ 
      message: "Sincronización completada exitosamente.", 
      matches_checked: pendingMatches.length 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    })
  }
})

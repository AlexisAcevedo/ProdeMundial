import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// API Configuration
const API_KEY = Deno.env.get('ZAFRONIX_API_KEY') || 'zwc_free_971b85269e49cc5e6724cedf'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const YEAR = 2026
const ZAFRONIX_BASE = "https://api.zafronix.com/fifa/worldcup/v1"

// Tipos de Zafronix API
interface ZafronixMatch {
  id: string
  date: string
  kickoff: string
  stage: string
  homeTeam: string | null
  awayTeam: string | null
  homeRef: string | null
  awayRef: string | null
  homeScore: number | null
  awayScore: number | null
  result: string | null
  status?: string
}

interface ZafronixTeamStanding {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  position: number | null
  advanced: boolean
}

interface ZafronixStandingsResponse {
  year: number
  groups: Record<string, ZafronixTeamStanding[]>
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function getEtag(supabase: any, endpoint: string): Promise<string | null> {
  const { data } = await supabase
    .from('api_sync_state')
    .select('etag')
    .eq('endpoint', endpoint)
    .single()
  return data?.etag || null
}

async function saveEtag(supabase: any, endpoint: string, etag: string) {
  await supabase
    .from('api_sync_state')
    .upsert({ endpoint, etag, last_sync: new Date().toISOString() })
}

serve(async (_req) => {
  const log: string[] = []

  try {
    if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Faltan variables de entorno.")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 1: Traer y actualizar Matches (Partidos)
    // ══════════════════════════════════════════════════════════════════════════
    log.push("▶ Consultando matches a Zafronix API...")
    
    const matchesEndpoint = `/matches?year=${YEAR}`
    const matchesEtag = await getEtag(supabase, matchesEndpoint)
    const matchesHeaders: HeadersInit = { 'X-API-Key': API_KEY }
    if (matchesEtag) matchesHeaders['If-None-Match'] = matchesEtag

    const matchesRes = await fetch(`${ZAFRONIX_BASE}${matchesEndpoint}`, { headers: matchesHeaders })

    if (matchesRes.status === 304) {
      log.push("✓ Matches 304 Not Modified - Skipping matches update.")
    } else if (!matchesRes.ok) {
      throw new Error(`API matches error: ${matchesRes.status} ${await matchesRes.text()}`)
    } else {
      const newMatchesEtag = matchesRes.headers.get('ETag')
      if (newMatchesEtag) await saveEtag(supabase, matchesEndpoint, newMatchesEtag)

      const matchesData = await matchesRes.json()
      const apiMatches: ZafronixMatch[] = matchesData.data ?? []
      log.push(`✓ ${apiMatches.length} partidos recibidos.`)

      // Get db matches
      const { data: dbMatches, error: dbError } = await supabase
        .from('matches')
        .select('id, match_number, status, home_team, away_team')
        .in('status', ['pending', 'in_progress'])

      if (dbError) throw dbError

      let updatedResults = 0
      
      // La API de Zafronix usa IDs estilo "2026-001" que mapearemos al match_number (001 -> 1)
      const apiByNumber = new Map<number, ZafronixMatch>()
      for (const m of apiMatches) {
        const num = parseInt(m.id.split('-')[1], 10)
        apiByNumber.set(num, m)
      }

      for (const dbMatch of (dbMatches ?? [])) {
        const apiMatch = apiByNumber.get(dbMatch.match_number)
        if (!apiMatch) continue

        // Usamos el status de Zafronix si existe (live, finished, scheduled)
        let newStatus = dbMatch.status
        if (apiMatch.status) {
          if (apiMatch.status === 'finished') newStatus = 'finished'
          else if (apiMatch.status === 'live' || apiMatch.status === 'in_play') newStatus = 'in_progress'
          else if (apiMatch.status === 'scheduled') newStatus = 'pending'
        } else {
          // Fallback legacy por si el status no viene
          if (apiMatch.homeScore !== null && apiMatch.awayScore !== null) {
            newStatus = 'finished'
          }
        }

        const updatePayload: Record<string, unknown> = {}
        let shouldUpdate = false

        if (newStatus !== dbMatch.status) {
          updatePayload.status = newStatus
          shouldUpdate = true
        }

        if (newStatus === 'finished') {
          updatePayload.home_score = apiMatch.homeScore
          updatePayload.away_score = apiMatch.awayScore
          shouldUpdate = true
        }

        // Actualizar nombres de equipos si se revelaron (pasan de TBD a un equipo real)
        const effectiveHome = apiMatch.homeTeam || apiMatch.homeRef || 'TBD'
        const effectiveAway = apiMatch.awayTeam || apiMatch.awayRef || 'TBD'

        if (effectiveHome !== dbMatch.home_team) {
          updatePayload.home_team = effectiveHome
          shouldUpdate = true
        }
        if (effectiveAway !== dbMatch.away_team) {
          updatePayload.away_team = effectiveAway
          shouldUpdate = true
        }

        if (shouldUpdate) {
          const { error: updateError } = await supabase
            .from('matches')
            .update(updatePayload)
            .eq('id', dbMatch.id)

          if (updateError) {
            log.push(`⚠ Error actualizando match ${dbMatch.match_number}: ${updateError.message}`)
          } else {
            updatedResults++
          }
        }
      }
      log.push(`✓ ${updatedResults} partidos actualizados.`)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 2: Traer y actualizar Standings (Tabla de posiciones)
    // ══════════════════════════════════════════════════════════════════════════
    log.push("▶ Consultando standings a Zafronix API...")
    
    const standingsEndpoint = `/standings?year=${YEAR}`
    const standingsEtag = await getEtag(supabase, standingsEndpoint)
    const standingsHeaders: HeadersInit = { 'X-API-Key': API_KEY }
    if (standingsEtag) standingsHeaders['If-None-Match'] = standingsEtag

    const standingsRes = await fetch(`${ZAFRONIX_BASE}${standingsEndpoint}`, { headers: standingsHeaders })

    if (standingsRes.status === 304) {
      log.push("✓ Standings 304 Not Modified - Skipping standings update.")
    } else if (!standingsRes.ok) {
      throw new Error(`API standings error: ${standingsRes.status}`)
    } else {
      const newStandingsEtag = standingsRes.headers.get('ETag')
      if (newStandingsEtag) await saveEtag(supabase, standingsEndpoint, newStandingsEtag)

      const standingsData: ZafronixStandingsResponse = await standingsRes.json()
      const upsertPayload: Record<string, unknown>[] = []

      for (const [groupLetter, teams] of Object.entries(standingsData.groups ?? {})) {
        // En Zafronix, "position" a veces viene null si no jugaron o están empatados totalmente,
        // pero la tabla está ordenada. Usamos index + 1 como fallback de rank.
        teams.forEach((row, index) => {
          upsertPayload.push({
            team_name: row.team,
            group_letter: groupLetter,
            points: row.points,
            played: row.played,
            won: row.won,
            drawn: row.drawn,
            lost: row.lost,
            goals_for: row.goalsFor,
            goals_against: row.goalsAgainst,
            goals_diff: row.goalDifference,
            rank: row.position ?? (index + 1),
            updated_at: new Date().toISOString(),
          })
        })
      }

      if (upsertPayload.length > 0) {
        const { error: upsertError } = await supabase
          .from('group_standings')
          .upsert(upsertPayload, { onConflict: 'group_letter,team_name' })

        if (upsertError) throw upsertError
        log.push(`✓ ${upsertPayload.length} filas de posiciones actualizadas.`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, log }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error: any) {
    log.push(`❌ Error: ${error.message}`)
    return new Response(
      JSON.stringify({ success: false, log, error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 400 }
    )
  }
})

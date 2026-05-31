import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const API_KEY = Deno.env.get('FOOTBALL_DATA_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// ─── Tipos de la API ──────────────────────────────────────────────────────────

interface ApiTeam {
  id: number
  name: string
  shortName: string
}

interface ApiMatch {
  id: number
  utcDate: string
  status: string // SCHEDULED | IN_PLAY | PAUSED | FINISHED | SUSPENDED | POSTPONED | CANCELLED | AWARDED
  stage: string
  group: string | null
  homeTeam: ApiTeam
  awayTeam: ApiTeam
  score: {
    winner: string | null
    duration: string
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

// ─── Mapeo de nombres API → nombres en nuestra DB ─────────────────────────────
// La API puede usar nombres ligeramente distintos a los que seteamos en el seed.
// Agregamos aquí cualquier discrepancia que aparezca.
const API_NAME_MAP: Record<string, string> = {
  "IR Iran": "IR Iran",
  "Côte d'Ivoire": "Côte d'Ivoire",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "DR Congo": "DR Congo",
  "Cabo Verde": "Cabo Verde",
  "Curaçao": "Curaçao",
  "United States": "USA",
  "Korea Republic": "South Korea",
}

function normalizeTeamName(apiName: string): string {
  return API_NAME_MAP[apiName] ?? apiName
}

// ─── Status de la API → nuestro status ───────────────────────────────────────
function normalizeStatus(apiStatus: string): 'pending' | 'in_progress' | 'finished' {
  if (apiStatus === 'FINISHED' || apiStatus === 'AWARDED') return 'finished'
  if (apiStatus === 'IN_PLAY' || apiStatus === 'PAUSED' || apiStatus === 'SUSPENDED') return 'in_progress'
  return 'pending'
}

// ─── Placeholder helpers ──────────────────────────────────────────────────────

// Detecta si un nombre de equipo es un placeholder (no es un equipo real)
function isPlaceholder(name: string): boolean {
  // Placeholders: "1A", "2B", "W73", "RU101", "3ABCDF", "Por Definir"
  if (!name || name === 'Por Definir') return true
  if (/^\d+[A-L]$/.test(name)) return true      // "1A", "2L"
  if (/^W\d+$/.test(name)) return true           // "W73", "W89"
  if (/^RU\d+$/.test(name)) return true          // "RU101"
  if (/^\d+[A-L]{2,}$/.test(name)) return true  // "3ABCDF"
  return false
}

serve(async (_req) => {
  const log: string[] = []

  try {
    if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Faltan variables de entorno.")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 1: Traer todos los partidos del torneo desde la API
    // Usamos un rango amplio para cubrir el torneo completo y no depender
    // de la fecha actual. El plan free de la API limita a 10 req/min.
    // ══════════════════════════════════════════════════════════════════════════
    log.push("▶ Consultando fixtures del Mundial a la API...")
    const fixturesRes = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches`,
      { headers: { 'X-Auth-Token': API_KEY } }
    )

    if (!fixturesRes.ok) {
      throw new Error(`API fixtures error: ${fixturesRes.status} ${await fixturesRes.text()}`)
    }

    const fixturesData = await fixturesRes.json()
    const apiMatches: ApiMatch[] = fixturesData.matches ?? []
    log.push(`✓ ${apiMatches.length} partidos recibidos de la API.`)

    // Construimos un mapa utcDate → ApiMatch para correlacionar con nuestra DB
    const apiByDate = new Map<string, ApiMatch>()
    for (const m of apiMatches) {
      // Normalizamos a ISO string sin milisegundos para comparar
      const key = new Date(m.utcDate).toISOString()
      apiByDate.set(key, m)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 2: Obtener nuestros partidos pendientes o en progreso de la DB
    // ══════════════════════════════════════════════════════════════════════════
    const { data: dbMatches, error: dbError } = await supabase
      .from('matches')
      .select('id, match_number, kickoff_time, status, home_team, away_team, stage')
      .in('status', ['pending', 'in_progress'])

    if (dbError) throw dbError
    log.push(`✓ ${dbMatches?.length ?? 0} partidos no finalizados en DB.`)

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 3: Actualizar resultados de partidos terminados
    // ══════════════════════════════════════════════════════════════════════════
    let updatedResults = 0

    for (const dbMatch of (dbMatches ?? [])) {
      const kickoffKey = new Date(dbMatch.kickoff_time).toISOString()
      const apiMatch = apiByDate.get(kickoffKey)

      if (!apiMatch) continue

      const newStatus = normalizeStatus(apiMatch.status)

      // Solo actualizamos si algo cambió
      if (newStatus === dbMatch.status && newStatus !== 'finished') continue

      const updatePayload: Record<string, unknown> = { status: newStatus }

      if (newStatus === 'finished' && apiMatch.score.fullTime.home !== null) {
        updatePayload.home_score = apiMatch.score.fullTime.home
        updatePayload.away_score = apiMatch.score.fullTime.away
      }

      // Si el partido tiene equipos reales en la API pero nosotros tenemos placeholder, actualizamos también
      if (!apiMatch.homeTeam.name.includes('TBD') && isPlaceholder(dbMatch.home_team)) {
        updatePayload.home_team = normalizeTeamName(apiMatch.homeTeam.name)
      }
      if (!apiMatch.awayTeam.name.includes('TBD') && isPlaceholder(dbMatch.away_team)) {
        updatePayload.away_team = normalizeTeamName(apiMatch.awayTeam.name)
      }

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

    log.push(`✓ ${updatedResults} partidos actualizados con resultados.`)

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 4: Actualizar tabla de posiciones desde la API
    // ══════════════════════════════════════════════════════════════════════════
    log.push("▶ Consultando standings del Mundial a la API...")
    const standingsRes = await fetch(
      `https://api.football-data.org/v4/competitions/WC/standings`,
      { headers: { 'X-Auth-Token': API_KEY } }
    )

    if (!standingsRes.ok) {
      throw new Error(`API standings error: ${standingsRes.status}`)
    }

    const standingsData = await standingsRes.json()
    const upsertPayload: Record<string, unknown>[] = []

    for (const groupObj of (standingsData.standings ?? [])) {
      if (groupObj.type !== "TOTAL" || groupObj.stage !== "GROUP_STAGE") continue

      const groupLetter = groupObj.group ? groupObj.group.replace('GROUP_', '').replace('GROUP ', '') : ''
      if (!groupLetter) continue

      for (const row of groupObj.table) {
        upsertPayload.push({
          team_name: normalizeTeamName(row.team.name),
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
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (upsertPayload.length > 0) {
      const { error: upsertError } = await supabase
        .from('group_standings')
        .upsert(upsertPayload, { onConflict: 'group_letter,team_name' })

      if (upsertError) throw upsertError
      log.push(`✓ ${upsertPayload.length} filas de posiciones actualizadas.`)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 5: Resolver placeholders de 1ro/2do de grupo con standings
    //
    // Estrategia: cuando un grupo tiene los 4 equipos con played=3 (terminó),
    // buscamos en la tabla matches los partidos de Round of 32 que tengan
    // placeholders como "1A", "2B" referentes a ese grupo y los reemplazamos
    // con el team_name real del rank correspondiente.
    // ══════════════════════════════════════════════════════════════════════════
    log.push("▶ Resolviendo placeholders de fase final...")

    // Traer las posiciones finales de grupos completos
    const { data: allStandings, error: standingsDbError } = await supabase
      .from('group_standings')
      .select('group_letter, team_name, rank, played')
      .order('group_letter')
      .order('rank')

    if (standingsDbError) throw standingsDbError

    // Agrupar por letra de grupo
    const standingsByGroup = new Map<string, Array<{ team_name: string; rank: number; played: number }>>()
    for (const row of (allStandings ?? [])) {
      const list = standingsByGroup.get(row.group_letter) ?? []
      list.push(row)
      standingsByGroup.set(row.group_letter, list)
    }

    // Traer todos los partidos con placeholders pendientes de resolver
    const { data: knockoutMatches, error: knockoutError } = await supabase
      .from('matches')
      .select('id, match_number, home_team, away_team')
      .neq('stage', 'Group Stage')

    if (knockoutError) throw knockoutError

    let resolvedPlaceholders = 0

    for (const match of (knockoutMatches ?? [])) {
      const updates: { home_team?: string; away_team?: string } = {}

      for (const side of ['home_team', 'away_team'] as const) {
        const placeholder = match[side] as string
        if (!isPlaceholder(placeholder)) continue

        // Intentar resolver "1A", "2B", etc.
        const groupRankMatch = placeholder.match(/^(\d+)([A-L])$/)
        if (groupRankMatch) {
          const rank = parseInt(groupRankMatch[1])
          const groupLetter = groupRankMatch[2]
          const groupStandings = standingsByGroup.get(groupLetter) ?? []

          // Solo resolver si el grupo está completo (los 4 equipos jugaron 3 partidos)
          const allPlayed3 = groupStandings.length === 4 && groupStandings.every(s => s.played >= 3)
          if (!allPlayed3) continue

          const team = groupStandings.find(s => s.rank === rank)
          if (team) {
            updates[side] = team.team_name
          }
          continue
        }

        // Intentar resolver "W73", "W89", etc. (ganador de un partido anterior)
        // Intentar resolver "RU101" (runner-up / perdedor de semifinal)
        const winnerMatch = placeholder.match(/^(W|RU)(\d+)$/)
        if (winnerMatch) {
          const type = winnerMatch[1] // "W" o "RU"
          const refMatchNumber = parseInt(winnerMatch[2])

          // Buscar el partido referenciado en nuestra DB (ya debería estar finished)
          const { data: refMatch } = await supabase
            .from('matches')
            .select('home_team, away_team, home_score, away_score, status')
            .eq('match_number', refMatchNumber)
            .eq('status', 'finished')
            .single()

          if (!refMatch || refMatch.home_score === null || refMatch.away_score === null) continue

          // Determinar ganador y perdedor
          // En fases de eliminación directa no puede haber empate en tiempo reglamentario,
          // pero si los scores son iguales (penales), la API ya los ajusta en score.winner.
          // Aquí confiamos en los scores finales que ya actualizamos en el Paso 3.
          let winner: string | null = null
          let runnerUp: string | null = null

          if (refMatch.home_score > refMatch.away_score) {
            winner = refMatch.home_team
            runnerUp = refMatch.away_team
          } else if (refMatch.away_score > refMatch.home_score) {
            winner = refMatch.away_team
            runnerUp = refMatch.home_team
          }
          // Si hay empate en score (penales), no podemos resolver localmente sin el campo winner de la API.
          // En ese caso dejamos el placeholder y lo resolverá el Paso 3 via apiMatch.homeTeam.

          if (type === 'W' && winner) {
            updates[side] = winner
          } else if (type === 'RU' && runnerUp) {
            updates[side] = runnerUp
          }
        }

        // Los placeholders tipo "3ABCDF" (mejor tercero) los resuelve la API directamente
        // en el fixture (Paso 3). No los calculamos aquí.
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('matches')
          .update(updates)
          .eq('id', match.id)

        if (updateError) {
          log.push(`⚠ Error resolviendo placeholder en match ${match.match_number}: ${updateError.message}`)
        } else {
          resolvedPlaceholders++
        }
      }
    }

    log.push(`✓ ${resolvedPlaceholders} placeholders resueltos.`)

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

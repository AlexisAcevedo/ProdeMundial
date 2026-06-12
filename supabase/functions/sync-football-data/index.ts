import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// ─── Tipos de la API (TheSportsDB) ──────────────────────────────────────────────

interface TSDBEvent {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  strTimestamp: string // formato: "2026-06-11T19:00:00"
  strStatus: string    // e.g. "FT", "NS", "LIVE", "HT"
  intRound: string
}

interface TSDBStanding {
  strTeam: string
  strGroup: string // e.g. "Group Stage - Group A"
  intRank: string
  intPlayed: string
  intWin: string
  intLoss: string
  intDraw: string
  intGoalsFor: string
  intGoalsAgainst: string
  intGoalDifference: string
  intPoints: string
}

// ─── Mapeo de nombres API → nombres en nuestra DB ─────────────────────────────
// TheSportsDB usa algunos nombres diferentes a nuestra base de datos.
const API_NAME_MAP: Record<string, string> = {
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Cape Verde": "Cabo Verde",
  "Czech Republic": "Czechia",
  "Ivory Coast": "Côte d'Ivoire",
  "Iran": "IR Iran",
  "United States": "USA"
}

function normalizeTeamName(apiName: string): string {
  return API_NAME_MAP[apiName] ?? apiName
}

// ─── Status de la API → nuestro status ───────────────────────────────────────
function normalizeStatus(apiStatus: string): 'pending' | 'in_progress' | 'finished' {
  const status = apiStatus ? apiStatus.toUpperCase() : ''
  if (['FT', 'AET', 'PEN'].includes(status)) return 'finished'
  if (['LIVE', 'HT'].includes(status)) return 'in_progress'
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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 1: Traer todos los partidos del torneo desde TheSportsDB
    // ══════════════════════════════════════════════════════════════════════════
    log.push("▶ Consultando fixtures del Mundial a TheSportsDB...")
    const fixturesRes = await fetch(
      "https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=4429&s=2026"
    )

    if (!fixturesRes.ok) {
      throw new Error(`TheSportsDB fixtures error: ${fixturesRes.status} ${await fixturesRes.text()}`)
    }

    const fixturesData = await fixturesRes.json()
    const apiMatches: TSDBEvent[] = fixturesData.events ?? []
    log.push(`✓ ${apiMatches.length} partidos recibidos de TheSportsDB.`)

    // Mapas para correlacionar los partidos
    const apiByTeams = new Map<string, TSDBEvent>()
    const apiByDate = new Map<string, TSDBEvent>()

    for (const m of apiMatches) {
      // 1. Correlación por nombres de equipos normalizados
      const homeNorm = normalizeTeamName(m.strHomeTeam)
      const awayNorm = normalizeTeamName(m.strAwayTeam)
      apiByTeams.set(`${homeNorm}_${awayNorm}`, m)

      // 2. Correlación por fecha (UTC) como fallback
      if (m.strTimestamp) {
        const dateStr = m.strTimestamp.endsWith('Z') ? m.strTimestamp : m.strTimestamp + 'Z'
        const key = new Date(dateStr).toISOString()
        apiByDate.set(key, m)
      }
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
      let apiMatch: TSDBEvent | undefined

      // Buscamos primero por combinación de equipos si no son placeholders
      if (!isPlaceholder(dbMatch.home_team) && !isPlaceholder(dbMatch.away_team)) {
        const teamKey = `${normalizeTeamName(dbMatch.home_team)}_${normalizeTeamName(dbMatch.away_team)}`
        apiMatch = apiByTeams.get(teamKey)
      }

      // Si no coincide por equipos (o son placeholders), buscamos por fecha
      if (!apiMatch) {
        const kickoffKey = new Date(dbMatch.kickoff_time).toISOString()
        apiMatch = apiByDate.get(kickoffKey)
      }

      if (!apiMatch) continue

      const newStatus = normalizeStatus(apiMatch.strStatus)

      // Solo actualizamos si algo cambió
      if (newStatus === dbMatch.status && newStatus !== 'finished') continue

      const updatePayload: Record<string, unknown> = { status: newStatus }

      if (newStatus === 'finished') {
        const homeScore = apiMatch.intHomeScore !== null && apiMatch.intHomeScore !== undefined && apiMatch.intHomeScore !== ""
          ? parseInt(apiMatch.intHomeScore)
          : null
        const awayScore = apiMatch.intAwayScore !== null && apiMatch.intAwayScore !== undefined && apiMatch.intAwayScore !== ""
          ? parseInt(apiMatch.intAwayScore)
          : null

        if (homeScore !== null && awayScore !== null) {
          updatePayload.home_score = homeScore
          updatePayload.away_score = awayScore
        }
      }

      // Si el partido tiene equipos reales en la API pero nosotros tenemos placeholder, actualizamos
      const isApiHomePlaceholder = !apiMatch.strHomeTeam || apiMatch.strHomeTeam.toUpperCase().includes('TBD') || isPlaceholder(apiMatch.strHomeTeam)
      const isApiAwayPlaceholder = !apiMatch.strAwayTeam || apiMatch.strAwayTeam.toUpperCase().includes('TBD') || isPlaceholder(apiMatch.strAwayTeam)

      if (!isApiHomePlaceholder && isPlaceholder(dbMatch.home_team)) {
        updatePayload.home_team = normalizeTeamName(apiMatch.strHomeTeam)
      }
      if (!isApiAwayPlaceholder && isPlaceholder(dbMatch.away_team)) {
        updatePayload.away_team = normalizeTeamName(apiMatch.strAwayTeam)
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
    // PASO 4: Actualizar tabla de posiciones desde TheSportsDB
    // ══════════════════════════════════════════════════════════════════════════
    log.push("▶ Consultando standings del Mundial a TheSportsDB...")
    const standingsRes = await fetch(
      "https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l=4429&s=2026"
    )

    if (!standingsRes.ok) {
      throw new Error(`TheSportsDB standings error: ${standingsRes.status}`)
    }

    const standingsData = await standingsRes.json()
    const apiStandings: TSDBStanding[] = standingsData.table ?? []
    const upsertPayload: Record<string, unknown>[] = []

    for (const row of apiStandings) {
      // strGroup tiene formato "Group Stage - Group A". Extraemos la letra.
      const groupMatch = row.strGroup ? row.strGroup.match(/Group Stage - Group ([A-L])/i) : null
      const groupLetter = groupMatch ? groupMatch[1].toUpperCase() : ''
      if (!groupLetter) continue

      upsertPayload.push({
        team_name: normalizeTeamName(row.strTeam),
        group_letter: groupLetter,
        points: parseInt(row.intPoints),
        played: parseInt(row.intPlayed),
        won: parseInt(row.intWin),
        drawn: parseInt(row.intDraw),
        lost: parseInt(row.intLoss),
        goals_for: parseInt(row.intGoalsFor),
        goals_against: parseInt(row.intGoalsAgainst),
        goals_diff: parseInt(row.intGoalDifference),
        rank: parseInt(row.intRank),
        updated_at: new Date().toISOString(),
      })
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
          let winner: string | null = null
          let runnerUp: string | null = null

          if (refMatch.home_score > refMatch.away_score) {
            winner = refMatch.home_team
            runnerUp = refMatch.away_team
          } else if (refMatch.away_score > refMatch.home_score) {
            winner = refMatch.away_team
            runnerUp = refMatch.home_team
          }

          if (type === 'W' && winner) {
            updates[side] = winner
          } else if (type === 'RU' && runnerUp) {
            updates[side] = runnerUp
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('matches')
          .update(updates)
          .eq('id', match.id)

        if (updateError) {
          log.push(`⚠ Error actualizando placeholder en match ${match.match_number}: ${updateError.message}`)
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

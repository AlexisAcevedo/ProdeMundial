import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Faltan las variables VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env");
  process.exit(1);
}

// Inicializamos el cliente con la clave de administrador para saltar el RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("⚙️ Leyendo archivos CSV...");
  const dataDir = path.resolve(process.cwd(), 'data');
  const teamsCsv = fs.readFileSync(path.join(dataDir, 'teams.csv'), 'utf-8');
  const matchesCsv = fs.readFileSync(path.join(dataDir, 'matches.csv'), 'utf-8');

  // 1. Mapear los Equipos (ID -> Nombre)
  const teamsMap = new Map<string, string>();
  const teamLines = teamsCsv.trim().split('\n').slice(1);
  for (const line of teamLines) {
    const parts = line.split(',');
    // El CSV de teams tiene: id,team_name,fifa_code,group_letter,is_placeholder
    if (parts.length >= 2) {
      teamsMap.set(parts[0], parts[1]);
    }
  }

  console.log(`✅ ${teamsMap.size} equipos cargados en memoria.`);

  // 2. Mapear los Partidos
  const matchLines = matchesCsv.trim().split('\n').slice(1);
  const matchesToInsert = [];

  for (const line of matchLines) {
    const parts = line.split(',');
    if (parts.length < 8) continue;
    
    // El CSV de matches tiene: id,match_number,home_team_id,away_team_id,city_id,stage_id,kickoff_at,match_label
    const id = parseInt(parts[0]);
    const home_team_id = parts[2];
    const away_team_id = parts[3];
    const kickoff_at = parts[6];
    const match_label = parts[7];

    // Generamos un UUID determinista usando el id numérico del partido para hacer el script idempotent
    const matchId = `00000000-0000-0000-0000-${id.toString().padStart(12, '0')}`;

    let home_team = teamsMap.get(home_team_id);
    let away_team = teamsMap.get(away_team_id);

    // Lógica para Octavos de Final en adelante (cuando todavía no hay ID de equipo definido)
    // Usamos el placeholder del match_label (ej: "1A vs 2B" -> home: "1A", away: "2B")
    if (!home_team || !away_team) {
      const labelParts = match_label.split(' vs ');
      if (labelParts.length === 2) {
        home_team = labelParts[0].trim();
        away_team = labelParts[1].trim();
      } else {
        home_team = 'Por Definir';
        away_team = 'Por Definir';
      }
    }

    matchesToInsert.push({
      id: matchId,
      home_team,
      away_team,
      kickoff_time: kickoff_at,
      home_score: null,
      away_score: null,
      status: 'pending'
    });
  }

  console.log(`⚙️ Preparando inserción de ${matchesToInsert.length} partidos a Supabase...`);

  // 3. Insertar en lotes (batching) para no saturar la red ni la API
  const BATCH_SIZE = 20;
  for (let i = 0; i < matchesToInsert.length; i += BATCH_SIZE) {
    const batch = matchesToInsert.slice(i, i + BATCH_SIZE);
    
    // Usamos upsert por si corremos el script dos veces, para que no duplique sino que actualice
    const { error } = await supabase.from('matches').upsert(batch);
    
    if (error) {
      console.error(`❌ Error insertando el lote ${i}:`, error.message);
    } else {
      console.log(`✅ Partidos del ${i + 1} al ${Math.min(i + BATCH_SIZE, matchesToInsert.length)} insertados correctamente.`);
    }
  }

  console.log("🎉 ¡Base de datos poblada exitosamente!");
}

main().catch(console.error);
export const TEAM_FLAG_MAP: Record<string, string> = {
  'Mexico': 'mx',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Czechia': 'cz',
  'Canada': 'ca',
  'Bosnia and Herzegovina': 'ba',
  'Qatar': 'qa',
  'Switzerland': 'ch',
  'Brazil': 'br',
  'Morocco': 'ma',
  'Haiti': 'ht',
  'Scotland': 'gb-sct',
  'USA': 'us',
  'Paraguay': 'py',
  'Australia': 'au',
  'Turkey': 'tr',
  'Germany': 'de',
  'Curaçao': 'cw',
  "Côte d'Ivoire": 'ci',
  'Ecuador': 'ec',
  'Netherlands': 'nl',
  'Japan': 'jp',
  'Sweden': 'se',
  'Tunisia': 'tn',
  'Belgium': 'be',
  'Egypt': 'eg',
  'IR Iran': 'ir',
  'New Zealand': 'nz',
  'Spain': 'es',
  'Cabo Verde': 'cv',
  'Saudi Arabia': 'sa',
  'Uruguay': 'uy',
  'France': 'fr',
  'Senegal': 'sn',
  'Iraq': 'iq',
  'Norway': 'no',
  'Argentina': 'ar',
  'Algeria': 'dz',
  'Austria': 'at',
  'Jordan': 'jo',
  'Portugal': 'pt',
  'DR Congo': 'cd',
  'Uzbekistan': 'uz',
  'Colombia': 'co',
  'England': 'gb-eng',
  'Croatia': 'hr',
  'Ghana': 'gh',
  'Panama': 'pa',
};

/**
 * Returns the ISO 3166-1 alpha-2 code or subdivision code for flag-icons
 * corresponding to the given team name. Returns null if no flag mapping exists
 * (e.g., knockout stage placeholders).
 */
export function getTeamFlagCode(teamName: string): string | null {
  if (!teamName) return null;
  return TEAM_FLAG_MAP[teamName] || null;
}

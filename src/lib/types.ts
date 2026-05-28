export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface League {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
}

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_time: string; // ISO string
  home_score: number | null;
  away_score: number | null;
  status: 'pending' | 'in_progress' | 'finished';
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points: number;
}
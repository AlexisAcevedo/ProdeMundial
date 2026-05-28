-- Enable uuid-ossp extension for UUID generation if not enabled by default
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users: Managed mostly by auth.users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  avatar_url text
);

-- 2. leagues: Groups where users compete
CREATE TABLE leagues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE
);

-- 3. league_members: Many-to-many junction table
CREATE TABLE league_members (
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (league_id, user_id)
);

-- 4. matches: Real-world tournament matches
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_team text NOT NULL,
  away_team text NOT NULL,
  kickoff_time timestamptz NOT NULL,
  home_score int,
  away_score int,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'finished')) DEFAULT 'pending'
);

-- 5. predictions: User submitted score guesses
CREATE TABLE predictions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  home_score int NOT NULL,
  away_score int NOT NULL,
  points int,
  UNIQUE (user_id, match_id)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) for predictions
-- Enforces 30-minute cutoff rule
-- ==========================================

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Allow all users to read predictions (we might restrict this to league members later, but open for now)
CREATE POLICY "Enable read access for all users" ON predictions
  FOR SELECT USING (true);

-- Allow users to insert their own predictions BEFORE the 30-minute cutoff
CREATE POLICY "Enable insert for users before cutoff" ON predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    now() < (SELECT kickoff_time FROM matches WHERE id = match_id) - interval '30 minutes'
  );

-- Allow users to update their own predictions BEFORE the 30-minute cutoff
CREATE POLICY "Enable update for users before cutoff" ON predictions
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    now() < (SELECT kickoff_time FROM matches WHERE id = match_id) - interval '30 minutes'
  )
  WITH CHECK (
    auth.uid() = user_id AND
    now() < (SELECT kickoff_time FROM matches WHERE id = match_id) - interval '30 minutes'
  );

-- ==========================================
-- SCORING TRIGGER
-- Calculates points when a match is finished
-- ==========================================

CREATE OR REPLACE FUNCTION calculate_prediction_points()
RETURNS TRIGGER AS $$
BEGIN
  -- We only calculate points if the match transitions to 'finished' and scores are set
  IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    
    UPDATE predictions
    SET points = 
      CASE
        -- Exact Score Prediction (3 points)
        WHEN predictions.home_score = NEW.home_score AND predictions.away_score = NEW.away_score THEN 3
        
        -- Correct Outcome Prediction: Home Win (1 point)
        WHEN predictions.home_score > predictions.away_score AND NEW.home_score > NEW.away_score THEN 1
        
        -- Correct Outcome Prediction: Away Win (1 point)
        WHEN predictions.home_score < predictions.away_score AND NEW.home_score < NEW.away_score THEN 1
        
        -- Correct Outcome Prediction: Tie (1 point)
        WHEN predictions.home_score = predictions.away_score AND NEW.home_score = NEW.away_score THEN 1
        
        -- Incorrect Prediction (0 points)
        ELSE 0
      END
    WHERE match_id = NEW.id;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_match_finished
  AFTER UPDATE OF status, home_score, away_score ON matches
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION calculate_prediction_points();

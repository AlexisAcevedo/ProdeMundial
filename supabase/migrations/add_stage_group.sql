-- Add stage and group columns to matches for filtering
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'Group Stage';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS group_letter text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_number int;

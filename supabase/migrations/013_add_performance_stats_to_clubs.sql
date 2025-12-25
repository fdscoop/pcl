-- Add club performance statistics columns
ALTER TABLE clubs 
ADD COLUMN club_rating DECIMAL(5, 2) DEFAULT 0 CHECK (club_rating >= 0 AND club_rating <= 100),
ADD COLUMN trophies_won INTEGER DEFAULT 0 CHECK (trophies_won >= 0),
ADD COLUMN total_matches INTEGER DEFAULT 0 CHECK (total_matches >= 0),
ADD COLUMN total_wins INTEGER DEFAULT 0 CHECK (total_wins >= 0),
ADD COLUMN total_draws INTEGER DEFAULT 0 CHECK (total_draws >= 0),
ADD COLUMN total_losses INTEGER DEFAULT 0 CHECK (total_losses >= 0),
ADD COLUMN total_goals_scored INTEGER DEFAULT 0 CHECK (total_goals_scored >= 0),
ADD COLUMN total_goals_conceded INTEGER DEFAULT 0 CHECK (total_goals_conceded >= 0);

-- Add indexes for better performance
CREATE INDEX idx_clubs_rating ON clubs(club_rating);
CREATE INDEX idx_clubs_trophies ON clubs(trophies_won);
CREATE INDEX idx_clubs_record ON clubs(total_wins, total_draws, total_losses);

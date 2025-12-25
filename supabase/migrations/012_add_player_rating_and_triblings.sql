-- Add player rating and additional statistics columns
ALTER TABLE players 
ADD COLUMN player_rating DECIMAL(5, 2) DEFAULT 0 CHECK (player_rating >= 0 AND player_rating <= 100),
ADD COLUMN trophies_won INTEGER DEFAULT 0 CHECK (trophies_won >= 0),
ADD COLUMN man_of_match_awards INTEGER DEFAULT 0 CHECK (man_of_match_awards >= 0),
ADD COLUMN yellow_cards INTEGER DEFAULT 0 CHECK (yellow_cards >= 0),
ADD COLUMN red_cards INTEGER DEFAULT 0 CHECK (red_cards >= 0),
ADD COLUMN injuries INTEGER DEFAULT 0 CHECK (injuries >= 0),
ADD COLUMN international_caps INTEGER DEFAULT 0 CHECK (international_caps >= 0);

-- Add indexes for better performance
CREATE INDEX idx_players_rating ON players(player_rating);
CREATE INDEX idx_players_trophies ON players(trophies_won);
CREATE INDEX idx_players_motm ON players(man_of_match_awards);
CREATE INDEX idx_players_cards ON players(yellow_cards, red_cards);
CREATE INDEX idx_players_intl_caps ON players(international_caps);

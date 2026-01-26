// Database types generated from Supabase schema

export type UserRole = 'player' | 'club_owner' | 'referee' | 'staff' | 'stadium_owner' | 'admin';
export type KYCStatus = 'pending' | 'verified' | 'rejected';
export type ContractStatus = 'active' | 'terminated' | 'amended' | 'pending' | 'rejected';
export type MatchFormat = 'friendly' | '5-a-side' | '7-a-side' | '11-a-side';
export type LeagueStructure = 'friendly' | 'hobby' | 'tournament' | 'amateur' | 'intermediate' | 'professional';
export type MatchStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type RegistrationStatus = 'registered' | 'unregistered' | 'pending';

export interface User {
 id: string;
 email: string;
 phone?: string;
 first_name: string;
 last_name: string;
 profile_photo_url?: string;
 bio?: string;
 role: UserRole;
 kyc_status: KYCStatus;
 kyc_verified_at?: string;
 is_active: boolean;
 last_login?: string;
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

export interface Club {
 id: string;
 owner_id: string;
 club_name: string;
 club_type?: string;
 category?: string;
 registration_number?: string;
 founded_year: number;
 city: string;
 state: string;
 district?: string;
 country: string;
 email: string;
 phone: string;
 website?: string;
 description?: string;
 logo_url?: string;
 banner_url?: string;
 registration_status?: RegistrationStatus;
 registered_at?: string;
 is_active?: boolean;
 club_rating?: number;
 trophies_won?: number;
 total_matches?: number;
 total_wins?: number;
 total_draws?: number;
 total_losses?: number;
 total_goals_scored?: number;
 total_goals_conceded?: number;
 clean_sheets?: number;
 stadium_capacity?: number;
 total_members?: number;
 kyc_verified?: boolean;
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

export interface Team {
 id: string;
 club_id: string;
 team_name: string;
 slug: string;
 description?: string;
 logo_url?: string;
 formation?: string;
 total_players: number;
 is_active: boolean;
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

export interface Player {
 id: string;
 user_id: string;
 unique_player_id: string;
 jersey_number?: number;
 position?: string;
 height_cm?: number;
 weight_kg?: number;
 date_of_birth?: string;
 nationality?: string;
 address?: string;
 district?: string;
 state?: string;
 preferred_foot?: 'left' | 'right' | 'both';
 current_club_id?: string;
 is_available_for_scout: boolean;
 total_matches_played: number;
 total_goals_scored: number;
 total_assists: number;
 player_rating?: number;
 trophies_won?: number;
 man_of_match_awards?: number;
 yellow_cards?: number;
 red_cards?: number;
 injuries?: number;
 international_caps?: number;
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

export interface Contract {
 id: string;
 player_id: string;
 club_id: string;
 status: ContractStatus;
 contract_start_date: string;
 contract_end_date: string;
 salary_monthly?: number;
 position_assigned?: string;
 jersey_number?: number;
 terms_conditions?: string;
 created_by: string;
 created_at: string;
 updated_at: string;
 terminated_at?: string;
 terminated_by?: string;
 termination_reason?: string;
 deleted_at?: string;
 // Signature fields
 club_signature_name?: string;
 club_signature_timestamp?: string;
 player_signature_timestamp?: string;
 player_signature_data?: Record<string, any>;
 contract_html?: string;
 signing_status?: string;
 // Read status fields
 read_by_club?: boolean;
 read_by_player?: boolean;
 club_read_at?: string;
 player_read_at?: string;
}

export interface Referee {
 id: string;
 user_id: string;
 unique_referee_id: string;
 certification_level?: string;
 certified_at?: string;
 experience_years: number;
 total_matches_refereed: number;
 is_available: boolean;
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

export interface Staff {
 id: string;
 user_id: string;
 unique_staff_id: string;
 role_type: string;
 specialization?: string;
 experience_years: number;
 is_available: boolean;
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

export interface Stadium {
 id: string;
 owner_id: string;
 stadium_name: string;
 slug: string;
 description?: string;
 location?: string;
 city?: string;
 state?: string;
 country?: string;
 capacity?: number;
 surface_type?: string;
 amenities?: string[];
 hourly_rate?: number;
 photo_urls?: string[];
 is_active: boolean;
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

export interface Tournament {
 id: string;
 organizer_id: string;
 tournament_name: string;
 slug: string;
 description?: string;
 league_structure: LeagueStructure;
 match_format: MatchFormat;
 start_date: string;
 end_date: string;
 location?: string;
 max_teams?: number;
 entry_fee?: number;
 status: string;
 prize_pool?: string;
 rules?: string;
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

export interface Match {
 id: string;
 tournament_id?: string;
 home_team_id: string;
 away_team_id: string;
 match_format: MatchFormat;
 match_date: string;
 match_time: string;
 stadium_id?: string;
 status: MatchStatus;
 home_team_score?: number;
 away_team_score?: number;
 match_summary?: string;
 created_by: string;
 created_at: string;
 updated_at: string;
 started_at?: string;
 ended_at?: string;
 deleted_at?: string;
}

export interface Notification {
 id: string;
 club_id?: string;
 player_id?: string;
 referee_id?: string;
 staff_id?: string;
 stadium_owner_id?: string;
 notification_type: 'contract_signed' | 'contract_created' | 'player_joined' | 'match_assigned' | 'payment_received' | string;
 title: string;
 message: string;
 contract_id?: string;
 related_user_id?: string;
 is_read: boolean; // Legacy field
 read_at?: string;
 read_by_club?: boolean; // Club-specific read status
 read_by_player?: boolean; // Player-specific read status
 read_by_referee?: boolean; // Referee-specific read status
 read_by_staff?: boolean; // Staff-specific read status
 read_by_stadium_owner?: boolean; // Stadium owner-specific read status
 club_read_at?: string; // When club read it
 player_read_at?: string; // When player read it
 referee_read_at?: string; // When referee read it
 staff_read_at?: string; // When staff read it
 stadium_owner_read_at?: string; // When stadium owner read it
 action_url?: string;
 created_at: string;
 updated_at: string;
}

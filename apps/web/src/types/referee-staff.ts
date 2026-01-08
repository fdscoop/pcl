// =====================================================
// REFEREE & STAFF TYPES
// TypeScript types for enhanced referee and staff system
// =====================================================

export type KYCStatus = 'pending' | 'verified' | 'rejected';
export type VerificationStatus = 'pending' | 'reviewing' | 'verified' | 'rejected' | 'incomplete';
export type BadgeLevel = 'district' | 'state' | 'aiff' | 'international';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'confirmed';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

// =====================================================
// REFEREE INTERFACES
// =====================================================

export interface Referee {
 id: string;
 user_id: string;
 unique_referee_id: string;
 
 // Profile
 bio?: string;
 profile_photo_url?: string;
 city?: string;
 state?: string;
 district?: string;
 country?: string;
 
 // Certification
 certification_level?: string;
 certified_at?: string;
 experience_years: number;
 total_matches_refereed: number;
 
 // Badge & Federation
 badge_level: BadgeLevel;
 federation?: string;
 license_number?: string;
 license_expiry_date?: string;
 
 // Financial
 hourly_rate?: number;
 
 // KYC & Verification
 kyc_status: KYCStatus;
 kyc_verified_at?: string;
 aadhaar_verified: boolean;
 pan_number?: string;
 pan_verified: boolean;
 bank_verified: boolean;
 documents_verified: boolean;
 
 // Availability
 is_available: boolean;
 availability_calendar?: Record<string, boolean>;
 
 // Permissions
 can_update_match_results: boolean;
 
 // Timestamps
 created_at: string;
 updated_at: string;
 deleted_at?: string;
 
 // Joined user data
 users?: {
 id: string;
 first_name: string;
 last_name: string;
 email: string;
 phone?: string;
 };
}

// =====================================================
// STAFF INTERFACES
// =====================================================

export interface Staff {
 id: string;
 user_id: string;
 unique_staff_id: string;
 
 // Profile
 bio?: string;
 profile_photo_url?: string;
 city?: string;
 state?: string;
 district?: string;
 country?: string;
 
 // Role
 role_type: string; // medic, assistant, linesman, match_commissioner, etc.
 specialization?: string;
 experience_years: number;
 
 // Financial
 hourly_rate?: number;
 
 // KYC & Verification
 kyc_status: KYCStatus;
 kyc_verified_at?: string;
 aadhaar_verified: boolean;
 pan_number?: string;
 pan_verified: boolean;
 bank_verified: boolean;
 documents_verified: boolean;
 
 // Availability
 is_available: boolean;
 availability_calendar?: Record<string, boolean>;
 
 // Permissions
 can_confirm_match_results: boolean;
 can_update_match_events: boolean;
 
 // Timestamps
 created_at: string;
 updated_at: string;
 deleted_at?: string;
 
 // Joined user data
 users?: {
 id: string;
 first_name: string;
 last_name: string;
 email: string;
 phone?: string;
 };
}

// =====================================================
// CERTIFICATION INTERFACES
// =====================================================

export interface RefereeCertification {
 id: string;
 referee_id: string;
 
 // Certificate Details
 certificate_type: string;
 certificate_name: string;
 issuing_authority: string;
 
 // Certificate Info
 certificate_number?: string;
 issue_date?: string;
 expiry_date?: string;
 is_expired?: boolean;
 
 // Document
 document_url?: string;
 document_file_path?: string;
 
 // Verification
 verification_status: VerificationStatus;
 verified_by?: string;
 verified_at?: string;
 verification_comments?: string;
 
 // Badge Level Grant
 grants_badge_level?: BadgeLevel;
 
 // Audit
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

export interface StaffCertification {
 id: string;
 staff_id: string;
 
 // Certificate Details
 certificate_type: string;
 certificate_name: string;
 issuing_authority: string;
 
 // Certificate Info
 certificate_number?: string;
 issue_date?: string;
 expiry_date?: string;
 is_expired?: boolean;
 
 // Document
 document_url?: string;
 document_file_path?: string;
 
 // Verification
 verification_status: VerificationStatus;
 verified_by?: string;
 verified_at?: string;
 verification_comments?: string;
 
 // Audit
 created_at: string;
 updated_at: string;
 deleted_at?: string;
}

// =====================================================
// DOCUMENT VERIFICATION INTERFACES
// =====================================================

export interface RefereeDocumentsVerification {
 id: string;
 referee_id: string;
 user_id: string;
 
 // Overall Status
 verification_status: VerificationStatus;
 
 // Statistics
 total_documents: number;
 verified_documents: number;
 pending_documents: number;
 rejected_documents: number;
 
 // Required Documents
 has_valid_certification: boolean;
 
 // Verification Details
 verified_by?: string;
 verified_at?: string;
 rejection_reason?: string;
 
 // Audit
 created_at: string;
 updated_at: string;
}

export interface StaffDocumentsVerification {
 id: string;
 staff_id: string;
 user_id: string;
 
 // Overall Status
 verification_status: VerificationStatus;
 
 // Statistics
 total_documents: number;
 verified_documents: number;
 pending_documents: number;
 rejected_documents: number;
 
 // Optional Documents
 has_valid_certification: boolean;
 
 // Verification Details
 verified_by?: string;
 verified_at?: string;
 rejection_reason?: string;
 
 // Audit
 created_at: string;
 updated_at: string;
}

// =====================================================
// MATCH ASSIGNMENT INTERFACES
// =====================================================

export interface MatchAssignment {
 id: string;
 match_id: string;
 referee_id?: string;
 staff_id?: string;
 assignment_type: string;
 status: string;
 
 // Invitation
 invitation_status: InvitationStatus;
 invited_at: string;
 responded_at?: string;
 rejection_reason?: string;
 
 // Financial
 hourly_rate_agreed?: number;
 total_hours?: number;
 payout_amount?: number;
 payout_status: PayoutStatus;
 
 confirmed_at?: string;
 created_at: string;
 updated_at: string;
 
 // Joined data
 matches?: {
 id: string;
 match_date: string;
 match_time: string;
 stadium_id: string;
 home_team_id: string;
 away_team_id: string;
 match_format: string;
 status: string;
 };
 referees?: Referee;
 staff?: Staff;
}

// =====================================================
// MATCH RESULT UPDATE INTERFACES
// =====================================================

export interface MatchResultUpdate {
 id: string;
 match_id: string;
 
 // Who updated
 updated_by_referee_id?: string;
 updated_by_staff_id?: string;
 updated_by_user_id?: string;
 
 // What was updated
 update_type: 'result_submitted' | 'result_confirmed' | 'score_updated' | 'event_added';
 
 // Result Details
 home_team_score?: number;
 away_team_score?: number;
 winner_team_id?: string;
 match_status?: string;
 
 // Notes
 notes?: string;
 
 // Confirmation
 confirmed: boolean;
 confirmed_by_staff_id?: string;
 confirmed_at?: string;
 
 // Audit
 created_at: string;
}

// =====================================================
// CERTIFICATE TYPE OPTIONS
// =====================================================

export const REFEREE_CERTIFICATE_TYPES = [
 { value: 'aiff_license', label: 'AIFF Referee License', badge: 'aiff' as BadgeLevel },
 { value: 'state_fa_license', label: 'State FA License', badge: 'state' as BadgeLevel },
 { value: 'district_certificate', label: 'District Certificate', badge: 'district' as BadgeLevel },
 { value: 'international_license', label: 'International License', badge: 'international' as BadgeLevel },
 { value: 'other', label: 'Other Certificate', badge: 'district' as BadgeLevel }
] as const;

export const STAFF_CERTIFICATE_TYPES = [
 { value: 'first_aid', label: 'First Aid Certificate' },
 { value: 'sports_medicine', label: 'Sports Medicine' },
 { value: 'event_management', label: 'Event Management' },
 { value: 'match_commissioner', label: 'Match Commissioner' },
 { value: 'safety_officer', label: 'Safety Officer' },
 { value: 'other', label: 'Other Certificate' }
] as const;

export const STAFF_ROLE_TYPES = [
 { value: 'assistant_referee', label: 'Assistant Referee' },
 { value: 'linesman', label: 'Linesman' },
 { value: 'fourth_official', label: 'Fourth Official' },
 { value: 'match_commissioner', label: 'Match Commissioner' },
 { value: 'medic', label: 'Medical Staff' },
 { value: 'safety_officer', label: 'Safety Officer' },
 { value: 'ground_staff', label: 'Ground Staff' },
 { value: 'other', label: 'Other' }
] as const;

// =====================================================
// UTILITY TYPES
// =====================================================

export interface RefereeWithRelations extends Referee {
 certifications?: RefereeCertification[];
 documents_verification?: RefereeDocumentsVerification;
 match_assignments?: MatchAssignment[];
}

export interface StaffWithRelations extends Staff {
 certifications?: StaffCertification[];
 documents_verification?: StaffDocumentsVerification;
 match_assignments?: MatchAssignment[];
}

// Form Types
export interface RefereeProfileFormData {
 bio?: string;
 city?: string;
 state?: string;
 district?: string;
 experience_years: number;
 hourly_rate?: number;
 certification_level?: string;
 federation?: string;
 license_number?: string;
 license_expiry_date?: string;
}

export interface StaffProfileFormData {
 bio?: string;
 city?: string;
 state?: string;
 district?: string;
 role_type: string;
 specialization?: string;
 experience_years: number;
 hourly_rate?: number;
}

export interface CertificationFormData {
 certificate_type: string;
 certificate_name: string;
 issuing_authority: string;
 certificate_number?: string;
 issue_date?: string;
 expiry_date?: string;
 document?: File;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface RefereeKYCStatus {
 aadhaar_verified: boolean;
 pan_verified: boolean;
 bank_verified: boolean;
 documents_verified: boolean;
 overall_status: KYCStatus;
 can_accept_matches: boolean;
}

export interface StaffKYCStatus {
 aadhaar_verified: boolean;
 pan_verified: boolean;
 bank_verified: boolean;
 documents_verified: boolean;
 overall_status: KYCStatus;
 can_accept_matches: boolean;
}

export interface MatchInvitation {
 id: string;
 assignment: MatchAssignment;
 match: {
 id: string;
 match_date: string;
 match_time: string;
 match_format: string;
 stadium_name: string;
 home_team_name: string;
 away_team_name: string;
 };
 club_owner: {
 first_name: string;
 last_name: string;
 };
 offered_rate: number;
 total_hours: number;
 estimated_payout: number;
}

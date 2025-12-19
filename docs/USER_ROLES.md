# PCL User Roles & Permissions Guide

## Overview

The PCL platform supports five primary user roles plus administrative functions. Each role has specific capabilities and restrictions designed to ensure platform integrity and prevent conflicts.

## 1. Player

### Profile Information
- Name, email, phone
- Nationality, date of birth
- Physical attributes (height, weight)
- Playing position, preferred foot
- Profile photo

### Unique Identifiers
- `unique_player_id` - PCL-assigned unique ID (format: PLAYER-XXXXXXXXXX)
- Prevents multiple player profiles per user
- Ensures contract enforcement

### Capabilities

#### Profile Management
- ✅ Create player profile
- ✅ Update personal information
- ✅ Upload profile photo
- ✅ Update position and playing stats

#### KYC Verification
- ✅ Submit KYC documents
- ✅ View verification status
- ✅ After verification:
  - ✅ Become visible to scout list
  - ✅ Receive contract offers

#### Contract Management
- ✅ View contract offers from clubs
- ✅ Accept/reject contract offers
- ✅ View active contracts
- ✅ Request contract amendments
- ✅ View contract history
- ❌ Cannot have multiple active contracts simultaneously

#### Performance Tracking
- ✅ View match participation
- ✅ Track goals and assists
- ✅ View statistics and performance

#### Availability
- ✅ Mark availability for scouting
- ✅ Update player availability status

### Restrictions
- Only one active contract per club at a time
- Can only be scouted when KYC verified
- Cannot create/manage clubs
- Cannot organize tournaments

### Data Owned by Player
- Player profile
- Contract agreements
- Performance statistics
- Match participation records

---

## 2. Club Owner

### Profile Information
- Name, email, phone
- Organization details

### Club Management

#### Club Creation & Registration
- ✅ Create multiple clubs
- ✅ Choose club name (unregistered)
- ✅ Register club with PCL (optional, official status)
- ✅ Update club information:
  - Logo, description
  - Website, contact details
  - Location, founding year
- ⚠️ Registered clubs can use official PCL names
- ⚠️ Unregistered clubs cannot use existing brand names

#### Team Management
- ✅ Create teams within club
- ✅ Set team formation
- ✅ Manage team rosters
- ✅ Update team information

#### Player Management
- ✅ Scout available players
- ✅ View KYC-verified players
- ✅ Send contract offers
- ✅ View sent offers and responses
- ✅ Manage active contracts

#### Contract Management
- ✅ Create contract offers
- ✅ Negotiate contract terms:
  - Salary, position, jersey number
  - Duration, terms & conditions
- ✅ Amend active contracts
- ✅ Terminate contracts with reason
- ✅ View contract amendments history

#### Match & Tournament Organization
- ✅ Schedule friendly matches
- ✅ Create tournaments
- ✅ Define tournament structure:
  - Friendly, Hobby, Tournament formats
  - Match formats (5-a-side, 7-a-side, 11-a-side)
- ✅ Manage tournament registrations
- ✅ Set tournament rules and prize pool

#### Challenge System
- ✅ Challenge other teams/clubs
- ✅ Propose match date/time/location
- ✅ Accept/reject challenges

#### Stadium Booking
- ✅ Search available stadiums
- ✅ Book stadium slots
- ✅ View booking history
- ✅ Cancel bookings (if allowed)

#### Match Management
- ✅ Assign referees and staff to matches
- ✅ Verify minimum requirements met:
  - Friendly/5-a-side: 1 referee, 1 staff
  - 7-a-side: 2 referees, 2 staff
  - 11-a-side: 3+ referees, 3+ staff
- ✅ Update match results
- ✅ Record match events

### Restrictions
- Cannot view confidential player data unless KYC verified
- Cannot force contract acceptance
- Can only modify own club data
- Must book available stadiums

### Data Owned by Club Owner
- Club information
- Teams
- Contracts created
- Matches scheduled
- Tournament information
- Challenge records

---

## 3. Referee

### Profile Information
- Name, email, phone
- Certification level
- Years of experience
- Certification date

### Unique Identifiers
- `unique_referee_id` - PCL-assigned ID

### Capabilities

#### Profile Management
- ✅ Create referee profile
- ✅ Update certification information
- ✅ Update availability status
- ✅ View match assignments

#### Match Assignments
- ✅ Accept/reject match assignments
- ✅ View assigned matches
- ✅ View match details
- ✅ Confirm attendance

#### Match Officiating
- ✅ Record match events (goals, cards, substitutions)
- ✅ Validate match requirements
- ✅ Submit match report
- ✅ Update match outcome

#### Statistics
- ✅ Track matches refereed
- ✅ View experience and ratings

### Restrictions
- Can only officiate assigned matches
- Cannot modify club or player contracts
- Cannot create tournaments
- Limited to assigned duties

---

## 4. Staff / Volunteer

### Profile Information
- Name, email, phone
- Role type (equipment manager, medic, coach, etc.)
- Specialization
- Years of experience

### Unique Identifiers
- `unique_staff_id` - PCL-assigned ID

### Capabilities

#### Profile Management
- ✅ Create staff profile
- ✅ Update role and specialization
- ✅ Update availability status

#### Match Assignments
- ✅ Accept/reject assignments
- ✅ View assigned matches
- ✅ Perform assigned duties
- ✅ Confirm availability

#### Match Support
- ✅ Assist in match organization
- ✅ Support match operations
- ✅ Record relevant events
- ✅ Submit duty report

#### Statistics
- ✅ Track events organized/supported
- ✅ View experience summary

### Restrictions
- Can only assist in assigned matches
- Cannot make officiating decisions
- Cannot manage contracts or players
- Limited to support roles

---

## 5. Stadium Owner

### Profile Information
- Name, email, phone
- Organization details

### Stadium Management

#### Stadium Listing
- ✅ Create multiple stadium listings
- ✅ Manage stadium details:
  - Name, location, capacity
  - Amenities, pricing
  - Photos and description
- ✅ Update stadium information
- ✅ Activate/deactivate listings

#### Slot Management
- ✅ Create booking slots
- ✅ Define slot timing
- ✅ Set availability calendar
- ✅ View bookings

#### Bookings
- ✅ View booking requests
- ✅ Confirm/reject bookings
- ✅ View booking history
- ✅ Manage cancellations
- ✅ Track revenue

### Pricing & Revenue
- ✅ Set hourly rates
- ✅ View earnings
- ✅ Manage payment information

### Restrictions
- Can only manage own stadiums
- Cannot participate in matches
- Cannot create contracts
- Limited to stadium operations

---

## 6. Admin (System Administrator)

### Global Capabilities
- ✅ Manage all users and accounts
- ✅ Verify KYC documents
- ✅ Manage club registrations
- ✅ Moderate content and data
- ✅ View platform statistics
- ✅ Generate reports
- ✅ Manage referees and staff assignments
- ✅ Resolve disputes
- ✅ System configuration

### Restrictions
- Limited to administrative duties
- Should not participate as players/clubs

---

## Permission Matrix

| Action | Player | Club Owner | Referee | Staff | Stadium Owner | Admin |
|--------|--------|-----------|---------|-------|---------------|-------|
| Create Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Club | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Create Team | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Scout Players | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Sign Contract | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Create Match | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Assign Referee | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Officiate Match | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| List Stadium | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Verify KYC | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View All Data | ❌ | Own Only | Limited | Limited | Own Only | ✅ |

---

## Data Visibility Rules

### Player Data Visibility
- **Unverified Players**: Visible only to themselves and admins
- **Verified Players**: Visible to clubs, scouts, admins
- **Private Data**: Email, phone (own user only)

### Club Data Visibility
- **Public**: Club name, logo, description
- **Semi-Public**: Teams, matches, tournaments
- **Private**: Financial, contract details (members only)

### Contract Data Visibility
- **Player**: Can view own contracts
- **Club**: Can view own contracts
- **Admin**: Can view all contracts
- **Others**: Cannot view

### Match Data Visibility
- **Public**: Match details, results, scores
- **Semi-Public**: Team rosters, assignments
- **Private**: Strategic information

---

## Role Transitions

### Upgrading Roles
- User can have multiple roles (e.g., player AND club owner)
- Each role has independent profile
- Switch between roles in app

### KYC Verification Dependency
- Players must be KYC verified to:
  - Become visible to scouts
  - Receive contract offers
  - Participate in official matches

### Club Registration
- Optional but provides:
  - Official PCL status
  - Right to use official brand names
  - Higher credibility

---

## Best Practices

### For Players
1. Complete KYC verification to receive offers
2. Keep profile updated with latest stats
3. Review contracts carefully before signing
4. Maintain professional conduct

### For Club Owners
1. Verify player KYC before signing
2. Keep contract terms clear and fair
3. Schedule matches with adequate notice
4. Ensure minimum referee/staff requirements

### For Referees
1. Maintain availability updates
2. Confirm assignments promptly
3. Submit accurate match reports
4. Adhere to officiating standards

### For Stadium Owners
1. Keep calendar updated
2. Maintain accurate pricing
3. Provide quality facilities
4. Respond to bookings promptly

---

## Conflict Resolution

### Dispute Process
1. User reports issue via platform
2. Admin reviews dispute
3. Evidence collected from both parties
4. Resolution made based on terms
5. Appeal process available

### Contract Disputes
- Both parties present case
- Admin reviews contract terms
- Mediation if needed
- Binding decision made

---

## Account Management

### Suspension & Termination
- **Temporary Suspension**: For policy violations
- **Permanent Termination**: For serious breaches
- **Data Retention**: Soft delete policy maintained

### Account Recovery
- Email-based recovery process
- Identity verification required
- Previous data accessible

---

For questions about roles and permissions, refer to Terms of Service or contact support.

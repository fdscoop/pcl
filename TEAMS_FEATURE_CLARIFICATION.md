# Teams Feature - Clarification & Implementation

## Question: "Why Teams 0 shows 0? Does it for different formats or just one team?"

### Answer: Teams are **NOT** format-specific. Here's how they work:

## Understanding Teams in the System

### **One Team Per Club** (Current Architecture)
- Each club can have **ONE primary team**
- A team can have **different squad lineups for different formats**:
  - **5-a-Side** lineup (8+ players)
  - **7-a-Side** lineup (11+ players)  
  - **11-a-Side** lineup (14+ players)

### **Team Structure**
```
Club
  └── Team (Single team per club)
      ├── Squad (All contracted players)
      ├── Lineup for 5-a-Side (e.g., 5 starting + 3 bench)
      ├── Lineup for 7-a-Side (e.g., 7 starting + 3-4 bench)
      └── Lineup for 11-a-Side (e.g., 11 starting + 4-5 bench)
```

### **Database Tables**
1. **teams** - One row per club's team
2. **team_squads** - Lists all active players in the squad
3. **team_lineups** - Different formations for each format
4. **team_lineup_players** - Specific player assignments to positions

## Implementation

### **Dashboard - Teams Count**
The dashboard now correctly shows:
- **0** if no teams have been created
- **1** if one team is created
- **N** teams (if multiple teams are supported in the future)

### **Code Changes**

**File**: `/Users/bineshbalan/pcl/apps/web/src/app/dashboard/club-owner/page.tsx`

1. **Added state for teams count**:
   ```typescript
   const [teamsCount, setTeamsCount] = useState(0)
   ```

2. **Fetch teams count on page load**:
   ```typescript
   const { data: teamsData, error: teamsError } = await supabase
     .from('teams')
     .select('id', { count: 'exact' })
     .eq('club_id', clubData.id)
   
   if (!teamsError && teamsData) {
     setTeamsCount(teamsData.length)
   }
   ```

3. **Updated Teams card**:
   ```typescript
   <div className="text-3xl font-bold text-foreground">{teamsCount}</div>
   <p className="text-xs text-muted-foreground mt-1">
     {teamsCount === 0 ? 'Create teams' : teamsCount === 1 ? '1 team created' : `${teamsCount} teams created`}
   </p>
   ```

## User Flow

### **Step 1: Scout & Sign Players**
- Recruit players to your club
- Dashboard shows contracted players count

### **Step 2: Create a Team**
- Click "Create Team" button
- Teams count changes from 0 → 1
- Dashboard updates in real-time

### **Step 3: Add Squad Members**
- Go to Team Management
- Click "Add Remaining to Squad"
- All contracted players are added to the squad

### **Step 4: Declare Formations**
- Switch to "Formation" tab
- Create lineup for 5-a-Side (minimum 8 players)
- Create lineup for 7-a-Side (minimum 11 players)
- Create lineup for 11-a-Side (minimum 14 players)

## Key Points

✅ **Teams are independent of formats**
- One team can have multiple format lineups
- Formats are just different squad configurations

✅ **Teams count is now dynamic**
- Actually fetches from database
- Shows real team count on dashboard

✅ **Future Scalability**
- Architecture supports multiple teams per club in the future
- Just remove the `.maybeSingle()` constraint in team-management page

## Future Enhancement

To allow **multiple teams per club** (e.g., "First Team" vs "Reserve Team"):
1. Change team query from `.maybeSingle()` to `.select('*')`
2. Add team selection dropdown in team-management page
3. Store additional team metadata (coach, home ground, etc.)

---

## Summary
The Teams count now correctly displays how many teams your club has created. Each team can manage lineups for multiple formats (5-a-side, 7-a-side, 11-a-side), but the **team itself is singular and format-agnostic**.

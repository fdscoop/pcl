/**
 * Contract Service - Handle contract operations with database
 * Ensures all signature fields and contract data are properly updated
 */

import { createClient } from '@/lib/supabase/client'
import { notifyContractSigned } from '@/services/matchNotificationService'

export interface SignContractPayload {
 contractId: string
 playerName: string
 playerSignatureData?: {
 name: string
 timestamp: string
 signedAt: string
 method: string
 ipAddress?: string
 }
}

/**
 * Sign a contract as a player
 * Updates all signature-related fields in the database
 */
export async function signContractAsPlayer(payload: SignContractPayload): Promise<{
 success: boolean
 error?: string
 data?: any
}> {
 try {
 const supabase = createClient()

 const now = new Date()
 const signatureData = payload.playerSignatureData || {
 name: payload.playerName,
 timestamp: now.toISOString(),
 signedAt: now.toLocaleString('en-IN'),
 method: 'digital'
 }

 // First, get the current contract to fetch its data
 const { data: existingContract, error: fetchError } = await supabase
 .from('contracts')
 .select('*')
 .eq('id', payload.contractId)
 .single()

 if (fetchError || !existingContract) {
 return {
 success: false,
 error: 'Could not find contract to sign'
 }
 }

 // Regenerate HTML with player signature included
 let updatedHtml = existingContract.contract_html
 if (existingContract.contract_html) {
 try {
 // Update the HTML to reflect the player signature
 updatedHtml = existingContract.contract_html.replace(
 /<p class="unsign-indicator">Awaiting signature\.\.\.<\/p>/g,
 `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
 <span style="font-size: 20px; color: #22c55e;">✅</span>
 <span style="font-size: 13px; color: #22c55e; font-weight: 600;">Digitally signed by</span>
 </div>
 <p style="font-size: 12px; color: #475569; margin: 4px 0;">Signed by: ${payload.playerName}</p>
 <p style="font-size: 11px; color: #64748b; margin-top: 8px;">
 Signed on: ${now.toLocaleDateString('en-IN')}
 </p>`
 )
 } catch (htmlError) {
 console.warn('Could not update HTML dynamically:', htmlError)
 // Continue with update even if HTML update fails
 }
 }

 // Update contract with signature and mark as read
 const { data, error } = await supabase
 .from('contracts')
 .update({
 player_signature_timestamp: now.toISOString(),
 player_signature_data: signatureData,
 signing_status: 'fully_signed',
 status: 'active',
 contract_html: updatedHtml,
 read_by_player: true,
 player_read_at: now.toISOString()
 })
 .eq('id', payload.contractId)
 .select()
 .single()

 if (error) {
 return {
 success: false,
 error: error.message
 }
 }

 // Update player status - mark as no longer available for scout
 const { error: playerUpdateError } = await supabase
 .from('players')
 .update({
 is_available_for_scout: false,
 current_club_id: existingContract.club_id
 })
 .eq('id', existingContract.player_id)

 if (playerUpdateError) {
 console.warn('Could not update player scout status:', playerUpdateError)
 // Continue even if this fails - contract is already signed
 }

 // Create notification for club owner about signed contract
 try {
 const playerInfo = await supabase
 .from('players')
 .select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout')
 .eq('id', existingContract.player_id)
 .single()
 
 // Then get user data separately
 let userInfo = null
 if (playerInfo.data) {
 userInfo = await supabase
 .from('users')
 .select('first_name, last_name')
 .eq('id', playerInfo.data.user_id)
 .single()
 }

 const clubInfo = await supabase
 .from('clubs')
 .select('club_name')
 .eq('id', existingContract.club_id)
 .single()

 const playerFullName = userInfo?.data 
 ? `${userInfo.data.first_name} ${userInfo.data.last_name}`
 : 'Player'

 const clubName = clubInfo.data?.club_name || 'Your Club'

 // Create notification for club owner about signed contract
 const { error: notificationInsertError } = await supabase
 .from('notifications')
 .insert({
 club_id: existingContract.club_id, // ✅ Club owner gets this
 notification_type: 'contract_signed',
 title: '✅ Contract Signed',
 message: `${playerFullName} has signed the contract for ${clubName}`,
 contract_id: payload.contractId,
 related_user_id: playerInfo.data?.user_id,
 action_url: `/dashboard/club-owner/contracts/${payload.contractId}/view`,
 is_read: false,
 read_by_club: false
 })
 
 if (notificationInsertError) {
 console.warn('❌ Error creating notification for club owner:', notificationInsertError)
 console.warn('Error details:', JSON.stringify(notificationInsertError, null, 2))
 } else {
 console.log('✅ Notification created for club owner')
 }

 // Also create confirmation notification for player
 try {
 const { error: playerNotificationError } = await supabase
 .from('notifications')
 .insert({
 player_id: existingContract.player_id, // ✅ Player gets confirmation
 notification_type: 'contract_signed_confirmation',
 title: '✅ Contract Signed',
 message: `You have successfully signed the contract with ${clubName}`,
 contract_id: payload.contractId,
 related_user_id: playerInfo.data?.user_id,
 action_url: `/dashboard/player/contracts/${payload.contractId}/view`, // ✅ Player view page
 is_read: false,
 read_by_player: false
 })

 if (playerNotificationError) {
 console.warn('❌ Error creating confirmation notification for player:', playerNotificationError)
 } else {
 console.log('✅ Confirmation notification created for player')
 }
 } catch (err) {
 console.warn('❌ Error creating player confirmation notification:', err)
 }

 // Send push notification to club owner
 try {
 await notifyContractSigned(
 existingContract.club_id,
 playerFullName,
 payload.contractId
 )
 console.log('✅ Push notification sent to club owner')
 } catch (pushErr) {
 console.warn('❌ Error sending push notification:', pushErr)
 // Don't fail if push notification fails
 }
 } catch (notificationError) {
 console.error('❌ Unexpected error in notification creation:', notificationError)
 // Continue even if notification creation fails
 }

 console.log('✅ Contract signed:', data)
 console.log('✅ Contract marked as read by player')
 console.log('✅ Player scout status updated - no longer available for scouting')

 return {
 success: true,
 data
 }
 } catch (err) {
 const errorMessage = err instanceof Error ? err.message : 'Unknown error'
 console.error('❌ Error signing contract:', err)

 return {
 success: false,
 error: errorMessage
 }
 }
}

/**
 * Get contract with all data
 */
export async function getContractWithDetails(contractId: string): Promise<any | null> {
 try {
 const supabase = createClient()

 const { data, error } = await supabase
 .from('contracts')
 .select('*')
 .eq('id', contractId)
 .single()

 if (error) {
 console.error('Error fetching contract:', error)
 return null
 }

 return data
 } catch (err) {
 console.error('Error in getContractWithDetails:', err)
 return null
 }
}

/**
 * Update contract HTML and policy information
 */
export async function updateContractHTML(
 contractId: string,
 contractHTML: string
): Promise<boolean> {
 try {
 const supabase = createClient()

 const { error } = await supabase
 .from('contracts')
 .update({
 contract_html: contractHTML
 })
 .eq('id', contractId)

 if (error) {
 console.error('Error updating contract HTML:', error)
 return false
 }

 return true
 } catch (err) {
 console.error('Error in updateContractHTML:', err)
 return false
 }
}

/**
 * Get contract signature status
 */
export async function getContractSignatureStatus(contractId: string): Promise<{
 isSigned: boolean
 signingStatus: string | null
 playerSignedAt?: string
 clubSignedAt?: string
 playerName?: string
}> {
 try {
 const supabase = createClient()

 const { data, error } = await supabase
 .from('contracts')
 .select('signing_status, player_signature_timestamp, club_signature_timestamp, player_signature_data')
 .eq('id', contractId)
 .single()

 if (error) {
 return {
 isSigned: false,
 signingStatus: null
 }
 }

 return {
 isSigned: data?.signing_status === 'fully_signed' || data?.signing_status === 'club_signed',
 signingStatus: data?.signing_status,
 playerSignedAt: data?.player_signature_timestamp,
 clubSignedAt: data?.club_signature_timestamp,
 playerName: data?.player_signature_data?.name
 }
 } catch (err) {
 console.error('Error in getContractSignatureStatus:', err)
 return {
 isSigned: false,
 signingStatus: null
 }
 }
}

/**
 * Reject a contract
 */
export async function rejectContract(contractId: string, reason?: string): Promise<boolean> {
 try {
 const supabase = createClient()

 const { error } = await supabase
 .from('contracts')
 .update({
 status: 'rejected'
 })
 .eq('id', contractId)

 if (error) {
 console.error('Error rejecting contract:', error)
 return false
 }

 return true
 } catch (err) {
 console.error('Error in rejectContract:', err)
 return false
 }
}

/**
 * Mark contract as read by player when they view it
 */
export async function markContractAsReadByPlayer(contractId: string): Promise<boolean> {
 try {
 const supabase = createClient()

 const { error } = await supabase
 .from('contracts')
 .update({
 read_by_player: true,
 player_read_at: new Date().toISOString()
 })
 .eq('id', contractId)

 if (error) {
 console.warn('Could not mark contract as read by player:', error)
 return false
 }

 console.log('✅ Contract marked as read by player')
 return true
 } catch (err) {
 console.error('Error marking contract as read:', err)
 return false
 }
}

/**
 * Get all contract data including HTML
 */
export async function getContractData(contractId: string): Promise<{
 contract: any
 contractHTML: string | null
} | null> {
 try {
 const supabase = createClient()

 const { data, error } = await supabase
 .from('contracts')
 .select('*')
 .eq('id', contractId)
 .single()

 if (error) {
 return null
 }

 return {
 contract: data,
 contractHTML: data.contract_html
 }
 } catch (err) {
 console.error('Error in getContractData:', err)
 return null
 }
}

/**
 * Get active contract for a player with club details
 * Handles RLS policies by fetching contract and club separately
 */
export async function getActiveContractForPlayer(playerId: string): Promise<{
 contract: any | null
 club: any | null
 error?: string
}> {
 try {
 const supabase = createClient()

 // Fetch active contract
 const { data: contractData, error: contractError } = await supabase
 .from('contracts')
 .select('*')
 .eq('player_id', playerId)
 .eq('status', 'active')
 .single()

 if (contractError) {
 // No active contract is normal, not an error
 if (contractError.code === 'PGRST116') {
 return { contract: null, club: null }
 }
 console.error('Error fetching active contract:', contractError)
 return { contract: null, club: null, error: contractError.message }
 }

 if (!contractData) {
 return { contract: null, club: null }
 }

 // Fetch club data separately (RLS requirement)
 const { data: clubData, error: clubError } = await supabase
 .from('clubs')
 .select('id, club_name, logo_url, city, state, country')
 .eq('id', contractData.club_id)
 .single()

 if (clubError) {
 console.warn('Error fetching club data:', clubError)
 return { contract: contractData, club: null }
 }

 return { contract: contractData, club: clubData }
 } catch (err) {
 console.error('Error in getActiveContractForPlayer:', err)
 return {
 contract: null,
 club: null,
 error: err instanceof Error ? err.message : 'Unknown error'
 }
 }
}

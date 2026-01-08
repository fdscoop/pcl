/**
 * useContractSigning - Hook for managing contract signing workflow
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
 ContractGenerationData, 
 generateContractHTML, 
 getDefaultPCLPolicies,
 formatDate
} from '@/utils/contractGenerator'

export interface SignContractData {
 contractId: string
 playerSignatureName: string
 signingTimestamp: string
 signingIPAddress?: string
 signatureDigitalData?: Record<string, any>
}

export interface UseContractSigningReturn {
 isLoading: boolean
 error: string | null
 signContract: (contractId: string, playerName: string) => Promise<boolean>
 generateAndStoreHTML: (contractId: string, data: ContractGenerationData) => Promise<boolean>
 fetchContractHTML: (contractId: string) => Promise<string | null>
}

/**
 * Hook to manage contract signing workflow
 */
export function useContractSigning(): UseContractSigningReturn {
 const [isLoading, setIsLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const supabase = createClient()

 /**
 * Sign a contract for the player
 */
 const signContract = useCallback(async (
 contractId: string,
 playerName: string
 ): Promise<boolean> => {
 try {
 setIsLoading(true)
 setError(null)

 const now = new Date().toISOString()

 // Update contract with signature information
 const { error: updateError } = await supabase
 .from('contracts')
 .update({
 player_signature_timestamp: now,
 player_signature_data: {
 name: playerName,
 timestamp: now,
 signedAt: new Date().toLocaleString('en-IN'),
 method: 'digital'
 },
 signing_status: 'fully_signed',
 status: 'active'
 })
 .eq('id', contractId)

 if (updateError) {
 setError(`Failed to sign contract: ${updateError.message}`)
 return false
 }

 return true
 } catch (err) {
 const errorMessage = err instanceof Error ? err.message : 'Unknown error'
 setError(errorMessage)
 return false
 } finally {
 setIsLoading(false)
 }
 }, [supabase])

 /**
 * Generate contract HTML and store in database
 */
 const generateAndStoreHTML = useCallback(async (
 contractId: string,
 data: ContractGenerationData
 ): Promise<boolean> => {
 try {
 setIsLoading(true)
 setError(null)

 // Generate HTML with default policies
 const policiesWithDefaults = [
 ...data.policies,
 ...getDefaultPCLPolicies()
 ]

 const enrichedData: ContractGenerationData = {
 ...data,
 policies: policiesWithDefaults
 }

 const contractHTML = generateContractHTML(enrichedData)

 // Store HTML in database
 const { error: updateError } = await supabase
 .from('contracts')
 .update({
 contract_html: contractHTML,
 signing_status: 'unsigned'
 })
 .eq('id', contractId)

 if (updateError) {
 setError(`Failed to store contract HTML: ${updateError.message}`)
 return false
 }

 return true
 } catch (err) {
 const errorMessage = err instanceof Error ? err.message : 'Unknown error'
 setError(errorMessage)
 return false
 } finally {
 setIsLoading(false)
 }
 }, [supabase])

 /**
 * Fetch stored contract HTML from database
 */
 const fetchContractHTML = useCallback(async (
 contractId: string
 ): Promise<string | null> => {
 try {
 setIsLoading(true)
 setError(null)

 const { data, error: fetchError } = await supabase
 .from('contracts')
 .select('contract_html')
 .eq('id', contractId)
 .single()

 if (fetchError) {
 setError(`Failed to fetch contract: ${fetchError.message}`)
 return null
 }

 return data?.contract_html || null
 } catch (err) {
 const errorMessage = err instanceof Error ? err.message : 'Unknown error'
 setError(errorMessage)
 return null
 } finally {
 setIsLoading(false)
 }
 }, [supabase])

 return {
 isLoading,
 error,
 signContract,
 generateAndStoreHTML,
 fetchContractHTML
 }
}

/**
 * Get IP address for signature tracking (requires API endpoint)
 */
export async function getClientIPAddress(): Promise<string | undefined> {
 try {
 const response = await fetch('https://api.ipify.org?format=json')
 const data = await response.json()
 return data.ip
 } catch (error) {
 console.error('Failed to fetch IP address:', error)
 return undefined
 }
}

/**
 * Validate contract before signing
 */
export async function validateContractBeforeSigning(
 contractId: string,
 supabase: ReturnType<typeof createClient>
): Promise<{ isValid: boolean; message: string }> {
 try {
 const { data, error } = await supabase
 .from('contracts')
 .select('status, signing_status, player_signature_timestamp')
 .eq('id', contractId)
 .single()

 if (error) {
 return {
 isValid: false,
 message: 'Contract not found'
 }
 }

 if (data.status !== 'pending') {
 return {
 isValid: false,
 message: 'Contract is not in pending status'
 }
 }

 if (data.player_signature_timestamp) {
 return {
 isValid: false,
 message: 'Contract has already been signed'
 }
 }

 if (data.signing_status === 'fully_signed') {
 return {
 isValid: false,
 message: 'Contract is already fully signed'
 }
 }

 return {
 isValid: true,
 message: 'Contract is ready to sign'
 }
 } catch (err) {
 return {
 isValid: false,
 message: 'Validation failed'
 }
 }
}

/**
 * Get contract signing history/timeline
 */
export async function getContractSigningTimeline(
 contractId: string,
 supabase: ReturnType<typeof createClient>
): Promise<Array<{ event: string; timestamp: string; actor: string }>> {
 try {
 const { data, error } = await supabase
 .from('contracts')
 .select(`
 created_at,
 created_by,
 club_signature_timestamp,
 player_signature_timestamp
 `)
 .eq('id', contractId)
 .single()

 if (error || !data) {
 return []
 }

 const timeline = []

 if (data.created_at) {
 timeline.push({
 event: 'Contract Created',
 timestamp: new Date(data.created_at).toLocaleString('en-IN'),
 actor: 'Club'
 })
 }

 if (data.club_signature_timestamp) {
 timeline.push({
 event: 'Club Signed',
 timestamp: new Date(data.club_signature_timestamp).toLocaleString('en-IN'),
 actor: 'Club Representative'
 })
 }

 if (data.player_signature_timestamp) {
 timeline.push({
 event: 'Player Signed',
 timestamp: new Date(data.player_signature_timestamp).toLocaleString('en-IN'),
 actor: 'Player'
 })
 }

 return timeline
 } catch (error) {
 console.error('Failed to get signing timeline:', error)
 return []
 }
}

/**
 * Send contract signing notification (webhook/email)
 */
export async function sendContractSigningNotification(
 contractId: string,
 playerName: string,
 clubName: string,
 recipientEmail: string
): Promise<{ success: boolean; message: string }> {
 try {
 // This would call a backend API endpoint
 // that handles email notifications
 
 const response = await fetch('/api/notifications/contract-signed', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 contractId,
 playerName,
 clubName,
 recipientEmail,
 timestamp: new Date().toISOString()
 })
 })

 if (!response.ok) {
 throw new Error('Failed to send notification')
 }

 return {
 success: true,
 message: 'Notification sent successfully'
 }
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : 'Unknown error'
 return {
 success: false,
 message: errorMessage
 }
 }
}

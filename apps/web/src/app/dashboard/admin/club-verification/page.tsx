'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import {
 Building2,
 CheckCircle,
 XCircle,
 Clock,
 Eye,
 AlertCircle,
 MapPin,
 User,
 Phone,
 Mail,
 Calendar,
 FileText,
 Shield
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useSearchParams } from 'next/navigation'

interface StadiumDocument {
 id: string
 stadium_id: string
 document_type: string
 verification_status: string
 verified_at: string | null
}

interface ClubVerification {
 id: string
 club_name: string
 club_type: string
 category: string
 registration_number: string | null
 founded_year: number
 city: string
 state: string
 country: string
 email: string
 phone: string
 website: string | null
 description: string | null
 logo_url: string | null
 kyc_verified: boolean
 kyc_verified_at: string | null
 is_active: boolean
 owner_id: string
 created_at: string
 owner: {
 first_name: string
 last_name: string
 email: string
 phone: string
 aadhaar_verified: boolean
 payout_account: Array<{
 account_holder_name: string
 account_number: string
 ifsc_code: string
 bank_name: string
 verification_status: string
 }> | null
 stadiums: Array<{
 id: string
 stadium_name: string
 documents: StadiumDocument[]
 }> | null
 }
 payout_account: {
 account_holder_name: string
 account_number: string
 ifsc_code: string
 bank_name: string
 verification_status: string
 } | null
}

export default function ClubVerification() {
 const searchParams = useSearchParams()
 const initialFilter = searchParams?.get('filter') || 'pending'
 const [clubs, setClubs] = useState<ClubVerification[]>([])
 const [loading, setLoading] = useState(true)
 const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>(initialFilter as any)
 const [selectedClub, setSelectedClub] = useState<ClubVerification | null>(null)
 const [verificationComments, setVerificationComments] = useState('')
 const [processing, setProcessing] = useState(false)
 const { addToast } = useToast()
 const supabase = createClient()

 useEffect(() => {
 loadClubs()
 }, [filter])

 const loadClubs = async () => {
 try {
 setLoading(true)

 let query = supabase
 .from('clubs')
 .select(`
 *,
 owner:users!clubs_owner_id_fkey(first_name, last_name, email, phone, aadhaar_verified)
 `)

 // Apply filters
 if (filter === 'pending') {
 query = query.eq('kyc_verified', false)
 } else if (filter === 'verified') {
 query = query.eq('kyc_verified', true)
 }
 // Note: 'rejected' filter removed as status column may not exist

 const { data, error } = await query.order('created_at', { ascending: false })

 if (error) throw error

 // Transform to normalize payout_account from owner and fetch stadiums
 const transformedData = await Promise.all(
 data?.map(async (club) => {
 // Fetch payout accounts for this club's owner
 const { data: payoutAccountsData, error: payoutError } = await supabase
 .from('payout_accounts')
 .select('account_holder_name, account_number, ifsc_code, bank_name, verification_status')
 .eq('user_id', club.owner_id)
 
 if (payoutError) {
 console.error(`Error fetching payout accounts for user ${club.owner_id}:`, payoutError)
 }
 
 const payoutAccounts = Array.isArray(payoutAccountsData) ? payoutAccountsData : []
 const primaryPayout = payoutAccounts.find((acc: any) => acc.verification_status === 'verified') || payoutAccounts[0] || null

 // Fetch stadiums and documents for this club's owner
 const { data: stadiumsData, error: stadiumsError } = await supabase
 .from('stadiums')
 .select('id, stadium_name')
 .eq('owner_id', club.owner_id)
 .is('deleted_at', null)
 
 if (stadiumsError) {
 console.error(`Error fetching stadiums for owner ${club.owner_id}:`, stadiumsError)
 }

 // Ensure stadiums is an array
 const stadiumsList = Array.isArray(stadiumsData) ? stadiumsData : []
 
 // Fetch documents for each stadium
 const stadiumsWithDocs = await Promise.all(
 stadiumsList.map(async (stadium) => {
 const { data: docsData } = await supabase
 .from('stadium_documents')
 .select('id, stadium_id, document_type, verification_status, verified_at')
 .eq('stadium_id', stadium.id)
 .is('deleted_at', null)
 
 return {
 ...stadium,
 documents: Array.isArray(docsData) ? docsData : []
 }
 })
 )

 return {
 ...club,
 payout_account: primaryPayout,
 owner: {
 ...club.owner,
 stadiums: stadiumsWithDocs
 }
 }
 }) || []
 )

 setClubs(transformedData)
 } catch (error) {
 console.error('Error loading clubs:', error)
 addToast({
 title: 'Error',
 description: 'Failed to load clubs',
 type: 'error'
 })
 } finally {
 setLoading(false)
 }
 }

 const handleViewDetails = (club: ClubVerification) => {
 setSelectedClub(club)
 setVerificationComments('')
 }

 const handleApproveClub = async () => {
 if (!selectedClub) return

 try {
 setProcessing(true)

 const { data: { user } } = await supabase.auth.getUser()
 if (!user) throw new Error('Not authenticated')

 const { error } = await supabase
 .from('clubs')
 .update({
 kyc_verified: true,
 kyc_verified_at: new Date().toISOString(),
 is_active: true
 })
 .eq('id', selectedClub.id)

 if (error) throw error

 addToast({
 title: 'Success',
 description: 'Club verified successfully',
 type: 'success'
 })

 // Reload data
 setSelectedClub(null)
 await loadClubs()

 } catch (error) {
 console.error('Error approving club:', error)
 addToast({
 title: 'Error',
 description: 'Failed to approve club',
 type: 'error'
 })
 } finally {
 setProcessing(false)
 }
 }

 const handleRejectClub = async () => {
 if (!selectedClub) return

 if (!verificationComments.trim()) {
 addToast({
 title: 'Error',
 description: 'Please provide rejection reason',
 type: 'error'
 })
 return
 }

 try {
 setProcessing(true)

 const { error } = await supabase
 .from('clubs')
 .update({
 kyc_verified: false,
 is_active: false
 })
 .eq('id', selectedClub.id)

 if (error) throw error

 addToast({
 title: 'Success',
 description: 'Club verification rejected',
 type: 'success'
 })

 // Reload data
 setSelectedClub(null)
 setVerificationComments('')
 await loadClubs()

 } catch (error) {
 console.error('Error rejecting club:', error)
 addToast({
 title: 'Error',
 description: 'Failed to reject club',
 type: 'error'
 })
 } finally {
 setProcessing(false)
 }
 }

 const getStatusBadge = (club: ClubVerification) => {
 if (club.kyc_verified) {
 return (
 <Badge variant="default" className="gap-1 bg-green-600">
 <CheckCircle className="w-3 h-3" />
 Verified
 </Badge>
 )
 }
 return (
 <Badge variant="secondary" className="gap-1">
 <Clock className="w-3 h-3" />
 Pending
 </Badge>
 )
 }

 const getKYCCompletionStatus = (club: ClubVerification) => {
 const aadhaarVerified = club.owner?.aadhaar_verified || false
 const bankVerified = club.payout_account?.verification_status === 'verified'
 
 const completed = [aadhaarVerified, bankVerified].filter(Boolean).length
 const total = 2

 return { completed, total, aadhaarVerified, bankVerified }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 </div>
 )
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-2">Club Verification</h1>
 <p className="text-muted-foreground">
 Review and approve club registrations and KYC verification
 </p>
 </div>

 {/* Filters */}
 <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
 <TabsList className="grid w-full grid-cols-3 bg-slate-100 ">
 <TabsTrigger value="all">All ({clubs.length})</TabsTrigger>
 <TabsTrigger value="pending">Pending</TabsTrigger>
 <TabsTrigger value="verified">Verified</TabsTrigger>
 </TabsList>

 <TabsContent value={filter} className="mt-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Clubs List */}
 <div className="space-y-4">
 {clubs.length === 0 ? (
 <Card className="border-2 border-dashed">
 <CardContent className="flex flex-col items-center justify-center py-12">
 <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
 <p className="text-muted-foreground text-center">
 No clubs found for this filter
 </p>
 </CardContent>
 </Card>
 ) : (
 clubs.map((club) => {
 const kycStatus = getKYCCompletionStatus(club)
 return (
 <Card
 key={club.id}
 className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
 selectedClub?.id === club.id
 ? 'border-blue-500 bg-blue-50 '
 : 'border-slate-200 '
 }`}
 onClick={() => handleViewDetails(club)}
 >
 <CardHeader>
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 {club.logo_url && (
 <img 
 src={club.logo_url} 
 alt={club.club_name}
 className="w-8 h-8 rounded-full object-cover"
 />
 )}
 <CardTitle className="text-lg">{club.club_name}</CardTitle>
 </div>
 <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
 <span className="flex items-center gap-1">
 <MapPin className="w-3 h-3" />
 {club.city}, {club.state}
 </span>
 <Badge variant="outline" className="text-xs">
 {club.club_type}
 </Badge>
 </div>
 </div>
 {getStatusBadge(club)}
 </div>
 </CardHeader>
 <CardContent>
 <div className="space-y-2 text-sm">
 <div className="flex items-center gap-2">
 <User className="w-4 h-4 text-muted-foreground" />
 <span className="font-medium">
 {club.owner?.first_name} {club.owner?.last_name}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <Mail className="w-4 h-4 text-muted-foreground" />
 <span className="text-muted-foreground">{club.owner?.email}</span>
 </div>
 <div className="flex items-center gap-2">
 <Calendar className="w-4 h-4 text-muted-foreground" />
 <span className="text-muted-foreground">Founded {club.founded_year}</span>
 </div>
 <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
 <div className="text-xs">
 <span className="text-muted-foreground">KYC Progress:</span>
 <span className={`ml-1 font-semibold ${
 kycStatus.completed === kycStatus.total ? 'text-green-600' : 'text-amber-600'
 }`}>
 {kycStatus.completed}/{kycStatus.total}
 </span>
 </div>
 <div className="text-xs">
 <span className="text-muted-foreground">Category:</span>
 <span className="ml-1 font-semibold">{club.category}</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 )
 })
 )}
 </div>

 {/* Club Details Panel */}
 <div className="lg:sticky lg:top-24 lg:self-start">
 {selectedClub ? (
 <Card className="border-2 border-blue-500 shadow-xl">
 <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 ">
 <CardTitle className="flex items-center gap-2">
 <Shield className="w-5 h-5 text-blue-600" />
 Club Verification Details
 </CardTitle>
 <CardDescription>
 {selectedClub.club_name}
 </CardDescription>
 </CardHeader>
 <CardContent className="pt-6 space-y-6">
 {/* Club Information */}
 <div className="space-y-3">
 <h3 className="font-semibold text-sm flex items-center gap-2">
 <Building2 className="w-4 h-4" />
 Club Information
 </h3>
 <div className="grid grid-cols-2 gap-3 text-sm">
 <div>
 <p className="text-muted-foreground text-xs">Type</p>
 <p className="font-medium">{selectedClub.club_type}</p>
 </div>
 <div>
 <p className="text-muted-foreground text-xs">Category</p>
 <p className="font-medium">{selectedClub.category}</p>
 </div>
 <div>
 <p className="text-muted-foreground text-xs">Founded</p>
 <p className="font-medium">{selectedClub.founded_year}</p>
 </div>
 <div>
 <p className="text-muted-foreground text-xs">Registration No.</p>
 <p className="font-medium">{selectedClub.registration_number || 'N/A'}</p>
 </div>
 </div>
 {selectedClub.description && (
 <div>
 <p className="text-muted-foreground text-xs mb-1">Description</p>
 <p className="text-sm">{selectedClub.description}</p>
 </div>
 )}
 </div>

 {/* Owner Information */}
 <div className="space-y-3 pt-3 border-t">
 <h3 className="font-semibold text-sm flex items-center gap-2">
 <User className="w-4 h-4" />
 Owner Information
 </h3>
 <div className="space-y-2 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Name</span>
 <span className="font-medium">
 {selectedClub.owner?.first_name} {selectedClub.owner?.last_name}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Email</span>
 <span className="font-medium text-xs">{selectedClub.owner?.email}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Phone</span>
 <span className="font-medium">{selectedClub.owner?.phone || 'N/A'}</span>
 </div>
 </div>
 </div>

 {/* KYC Status */}
 <div className="space-y-3 pt-3 border-t">
 <h3 className="font-semibold text-sm flex items-center gap-2">
 <FileText className="w-4 h-4" />
 KYC Verification Status
 </h3>
 <div className="space-y-2">
 <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 ">
 <span className="text-sm font-medium">Aadhaar Verification</span>
 {selectedClub.owner?.aadhaar_verified ? (
 <Badge variant="default" className="bg-green-600 gap-1">
 <CheckCircle className="w-3 h-3" />
 Verified
 </Badge>
 ) : (
 <Badge variant="secondary" className="gap-1">
 <Clock className="w-3 h-3" />
 Pending
 </Badge>
 )}
 </div>
 <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 ">
 <span className="text-sm font-medium">Bank Account</span>
 {selectedClub.payout_account?.verification_status === 'verified' ? (
 <Badge variant="default" className="bg-green-600 gap-1">
 <CheckCircle className="w-3 h-3" />
 Verified
 </Badge>
 ) : (
 <Badge variant="secondary" className="gap-1">
 <Clock className="w-3 h-3" />
 Pending
 </Badge>
 )}
 </div>
 </div>

 {selectedClub.payout_account && (
 <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 ">
 <p className="text-xs font-semibold text-blue-900 mb-2">Bank Details</p>
 <div className="space-y-1 text-xs">
 <div className="flex justify-between">
 <span className="text-blue-800 ">Account Holder</span>
 <span className="font-medium">{selectedClub.payout_account.account_holder_name}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-blue-800 ">Account Number</span>
 <span className="font-mono font-medium">****{selectedClub.payout_account.account_number.slice(-4)}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-blue-800 ">IFSC Code</span>
 <span className="font-mono font-medium">{selectedClub.payout_account.ifsc_code}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-blue-800 ">Bank</span>
 <span className="font-medium">{selectedClub.payout_account.bank_name}</span>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Stadium Documents */}
 {selectedClub.owner?.stadiums && selectedClub.owner.stadiums.length > 0 && (
 <div className="space-y-3 pt-3 border-t">
 <h3 className="font-semibold text-sm flex items-center gap-2">
 <Building2 className="w-4 h-4" />
 Stadium Documents ({selectedClub.owner.stadiums.length})
 </h3>
 <div className="space-y-2">
 {selectedClub.owner.stadiums.map((stadium) => (
 <div key={stadium.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 ">
 <p className="font-medium text-sm mb-2">{stadium.stadium_name}</p>
 {stadium.documents && stadium.documents.length > 0 ? (
 <div className="space-y-1 text-xs">
 {stadium.documents.map((doc) => (
 <div key={doc.id} className="flex items-center justify-between">
 <span className="text-muted-foreground">{doc.document_type}</span>
 {doc.verification_status === 'verified' ? (
 <Badge variant="default" className="bg-green-600 gap-1 text-xs">
 <CheckCircle className="w-2.5 h-2.5" />
 Verified
 </Badge>
 ) : doc.verification_status === 'rejected' ? (
 <Badge variant="destructive" className="gap-1 text-xs">
 <XCircle className="w-2.5 h-2.5" />
 Rejected
 </Badge>
 ) : (
 <Badge variant="secondary" className="gap-1 text-xs">
 <Clock className="w-2.5 h-2.5" />
 {doc.verification_status}
 </Badge>
 )}
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground">No documents submitted</p>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Verification Actions */}
 {!selectedClub.kyc_verified && (
 <div className="space-y-3 pt-3 border-t">
 <h3 className="font-semibold text-sm">Verification Decision</h3>
 
 {(() => {
 const kycStatus = getKYCCompletionStatus(selectedClub)
 const isKYCComplete = kycStatus.completed === kycStatus.total

 if (!isKYCComplete) {
 return (
 <Alert>
 <AlertCircle className="w-4 h-4" />
 <AlertDescription className="text-xs">
 <strong>KYC Incomplete:</strong> Owner must complete {
 !kycStatus.aadhaarVerified && !kycStatus.bankVerified 
 ? 'Aadhaar and Bank verification'
 : !kycStatus.aadhaarVerified 
 ? 'Aadhaar verification'
 : 'Bank verification'
 } before club can be approved.
 </AlertDescription>
 </Alert>
 )
 }

 return (
 <>
 <Textarea
 placeholder="Add comments (optional for approval, required for rejection)"
 value={verificationComments}
 onChange={(e) => setVerificationComments(e.target.value)}
 rows={3}
 className="text-sm"
 />
 <div className="flex gap-2">
 <Button
 onClick={handleApproveClub}
 disabled={processing}
 className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2"
 >
 <CheckCircle className="w-4 h-4" />
 Approve Club
 </Button>
 <Button
 onClick={handleRejectClub}
 disabled={processing}
 variant="destructive"
 className="flex-1 gap-2"
 >
 <XCircle className="w-4 h-4" />
 Reject
 </Button>
 </div>
 </>
 )
 })()}
 </div>
 )}

 {selectedClub.kyc_verified && (
 <Alert className="bg-green-50 border-green-500">
 <CheckCircle className="w-4 h-4 text-green-600" />
 <AlertDescription className="text-green-800 ">
 <strong>Club Verified:</strong> This club has been approved and is active on the platform.
 {selectedClub.kyc_verified_at && (
 <span className="block text-xs mt-1">
 Verified on {new Date(selectedClub.kyc_verified_at).toLocaleDateString()}
 </span>
 )}
 </AlertDescription>
 </Alert>
 )}
 </CardContent>
 </Card>
 ) : (
 <Card className="border-2 border-dashed">
 <CardContent className="flex flex-col items-center justify-center py-12">
 <Eye className="w-12 h-12 text-muted-foreground mb-4" />
 <p className="text-muted-foreground text-center">
 Select a club to view verification details
 </p>
 </CardContent>
 </Card>
 )}
 </div>
 </div>
 </TabsContent>
 </Tabs>
 </div>
 )
}

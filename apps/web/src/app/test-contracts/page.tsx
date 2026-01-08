'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestContractsPage() {
 const [contracts, setContracts] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [user, setUser] = useState<any>(null)

 useEffect(() => {
 loadData()
 }, [])

 const loadData = async () => {
 const supabase = createClient()

 // Get current user
 const { data: { user: currentUser } } = await supabase.auth.getUser()
 setUser(currentUser)

 // Get ALL contracts (no filtering)
 const { data, error } = await supabase
 .from('contracts')
 .select('*')
 .order('created_at', { ascending: false })

 console.log('All contracts:', data)
 console.log('Error:', error)

 if (error) {
 console.error('Error loading contracts:', error)
 } else {
 setContracts(data || [])
 }

 setLoading(false)
 }

 if (loading) {
 return <div className="p-8">Loading...</div>
 }

 return (
 <div className="min-h-screen bg-slate-50 p-8">
 <Card className="max-w-6xl mx-auto">
 <CardHeader>
 <CardTitle>Contract Test Page - All Contracts in Database</CardTitle>
 <p className="text-sm text-slate-600">Current user: {user?.email}</p>
 </CardHeader>
 <CardContent>
 <div className="mb-4">
 <Button onClick={loadData} variant="outline">
 Refresh Data
 </Button>
 </div>

 <div className="space-y-4">
 <p className="font-semibold">Total Contracts: {contracts.length}</p>

 {contracts.length === 0 ? (
 <div className="text-center py-12 text-slate-500">
 <p>No contracts found in database</p>
 </div>
 ) : (
 <div className="space-y-4">
 {contracts.map((contract) => (
 <div key={contract.id} className="border border-slate-300 rounded p-4 bg-white">
 <div className="grid grid-cols-2 gap-2 text-sm">
 <div>
 <span className="font-semibold">Contract ID:</span> {contract.id}
 </div>
 <div>
 <span className="font-semibold">Status:</span> {contract.status}
 </div>
 <div>
 <span className="font-semibold">Player ID:</span> {contract.player_id}
 </div>
 <div>
 <span className="font-semibold">Club ID:</span> {contract.club_id}
 </div>
 <div>
 <span className="font-semibold">Contract Type:</span> {contract.contract_type}
 </div>
 <div>
 <span className="font-semibold">Annual Salary:</span> {contract.annual_salary}
 </div>
 <div>
 <span className="font-semibold">Start Date:</span> {contract.contract_start_date}
 </div>
 <div>
 <span className="font-semibold">End Date:</span> {contract.contract_end_date}
 </div>
 <div>
 <span className="font-semibold">Created By:</span> {contract.created_by}
 </div>
 <div>
 <span className="font-semibold">Created At:</span> {new Date(contract.created_at).toLocaleString()}
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 </div>
 )
}

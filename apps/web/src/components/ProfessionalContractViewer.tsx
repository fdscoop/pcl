'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Contract {
 id: string
 clubs: {
 club_name: string
 logo_url?: string
 contact_email?: string
 contact_phone?: string
 city?: string
 state?: string
 }
 contract_start_date: string
 contract_end_date: string
 salary_monthly?: number
 position_assigned?: string
 jersey_number?: number
 terms_conditions?: string
 status: 'pending' | 'active' | 'rejected' | 'terminated'
 club_signature_timestamp?: string
 club_signature_name?: string
 player_signature_timestamp?: string
 signing_status?: string
 created_by?: string
}

interface ContractViewerProps {
 contract: Contract
 playerName: string
 playerId: string
 onSign?: (contractId: string) => void
 isFullPage?: boolean
}

export function ProfessionalContractViewer({
 contract,
 playerName,
 playerId,
 onSign,
 isFullPage = false
}: ContractViewerProps) {
 const [showSigningPanel, setShowSigningPanel] = useState(false)
 const [signature, setSignature] = useState('')
 const [signingDate, setSigningDate] = useState(new Date().toLocaleDateString())

 const formatCurrency = (amount?: number) => {
 if (!amount) return '₹0'
 return new Intl.NumberFormat('en-IN', {
 style: 'currency',
 currency: 'INR',
 maximumFractionDigits: 0
 }).format(amount)
 }

 const formatDate = (dateString: string) => {
 return new Date(dateString).toLocaleDateString('en-IN', {
 day: '2-digit',
 month: 'long',
 year: 'numeric'
 })
 }

 const totalSalary = contract.salary_monthly 
 ? (contract.salary_monthly * ((new Date(contract.contract_end_date).getTime() - new Date(contract.contract_start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)))
 : 0

 const handleSignContract = async () => {
 if (!signature.trim()) {
 alert('Please provide your signature name')
 return
 }

 if (onSign) {
 onSign(contract.id)
 // In real implementation, save signature to database
 setShowSigningPanel(false)
 }
 }

 return (
 <div className={`${isFullPage ? 'min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4' : ''}`}>
 <div className="max-w-4xl mx-auto">
 {/* Professional Contract Document */}
 <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
 {/* Header */}
 <div className="border-b-4 border-blue-900 bg-gradient-to-r from-blue-50 to-white p-8">
 <div className="flex items-center justify-between mb-6">
 {contract.clubs?.logo_url ? (
 <div className="relative w-20 h-20">
 <Image
 src={contract.clubs.logo_url}
 alt={contract.clubs.club_name}
 fill
 className="object-contain"
 />
 </div>
 ) : (
 <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
 <span className="text-3xl">🏆</span>
 </div>
 )}
 
 <div className="text-right">
 <h1 className="text-3xl font-bold text-blue-900">
 {contract.clubs?.club_name}
 </h1>
 <p className="text-sm text-slate-600">
 Professional Football Club
 </p>
 </div>
 </div>

 <div className="text-center py-4 bg-white rounded-lg border-2 border-blue-100">
 <h2 className="text-2xl font-bold text-slate-900 mb-2">
 Professional Football Player Contract
 </h2>
 <p className="text-sm text-slate-600">
 Contract ID: {contract.id.slice(0, 8).toUpperCase()}...
 </p>
 <p className="text-sm text-slate-600">
 Date: {formatDate(contract.contract_start_date)}
 </p>
 </div>
 </div>

 {/* Player ID Highlight */}
 <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white p-6 text-center font-bold text-lg">
 🆔 PLAYER: {playerName} | ID: {playerId}
 </div>

 {/* Contract Parties */}
 <div className="p-8">
 <h3 className="text-xl font-bold text-blue-900 mb-6 pb-3 border-b-2 border-orange-500">
 Contract Parties
 </h3>

 <div className="grid md:grid-cols-2 gap-8 mb-8">
 {/* Club Info */}
 <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-blue-900">
 <h4 className="text-lg font-bold text-blue-900 mb-4">THE CLUB</h4>
 <div className="space-y-2 text-sm">
 <p><strong>{contract.clubs?.club_name}</strong></p>
 <p>Professional Football Club</p>
 <p>{contract.clubs?.city}, {contract.clubs?.state}</p>
 <p className="text-slate-600">
 Email: {contract.clubs?.contact_email || 'N/A'}
 </p>
 <p className="text-slate-600">
 Phone: {contract.clubs?.contact_phone || 'N/A'}
 </p>
 </div>
 </div>

 {/* Player Info */}
 <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-orange-500">
 <h4 className="text-lg font-bold text-blue-900 mb-4">THE PLAYER</h4>
 <div className="space-y-2 text-sm">
 <p><strong>{playerName}</strong></p>
 <p><strong>Player ID:</strong> {playerId}</p>
 <p><strong>Position:</strong> {contract.position_assigned || 'N/A'}</p>
 <p><strong>Jersey Number:</strong> #{contract.jersey_number || 'N/A'}</p>
 </div>
 </div>
 </div>

 {/* Contract Terms */}
 <h3 className="text-xl font-bold text-blue-900 mb-6 pb-3 border-b-2 border-orange-500">
 Contract Terms
 </h3>

 <div className="bg-slate-50 p-6 rounded-lg mb-8 space-y-3 text-sm">
 <p><strong>Contract Type:</strong> Professional Player Contract</p>
 <p><strong>Duration:</strong> {formatDate(contract.contract_start_date)} to {formatDate(contract.contract_end_date)}</p>
 <p>
 <strong>Total Duration:</strong> {(() => {
 const startDate = new Date(contract.contract_start_date)
 const endDate = new Date(contract.contract_end_date)
 const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
 const days = endDate.getDate() - startDate.getDate()
 const totalMonths = days >= 0 ? months : months - 1
 return totalMonths + 1
 })()}
 {' '} months
 </p>
 <p><strong>Playing Position:</strong> {contract.position_assigned || 'N/A'}</p>
 <p><strong>Contract Status:</strong> <span className="font-bold text-blue-900">{contract.status.toUpperCase()}</span></p>
 </div>

 {/* Financial Terms */}
 <div className="bg-gradient-to-r from-blue-900 to-orange-500 text-white p-8 rounded-lg mb-8 text-center">
 <h3 className="text-2xl font-bold mb-4">Financial Terms</h3>
 <div className="text-4xl font-bold mb-2">
 ₹{formatCurrency(totalSalary)}
 </div>
 <p className="text-lg opacity-90">
 Total Contract Value | Monthly: {formatCurrency(contract.salary_monthly)}
 </p>
 </div>

 {/* Financial Breakdown */}
 <h3 className="text-xl font-bold text-blue-900 mb-6 pb-3 border-b-2 border-orange-500">
 Financial Breakdown
 </h3>

 <div className="grid md:grid-cols-2 gap-6 mb-8">
 <div className="bg-slate-50 p-6 rounded-lg">
 <h4 className="text-lg font-bold text-blue-900 mb-4">Base Compensation</h4>
 <div className="space-y-2 text-sm">
 <p><strong>Monthly Salary:</strong> {formatCurrency(contract.salary_monthly)}</p>
 <p><strong>Total Salary:</strong> {formatCurrency(totalSalary)}</p>
 </div>
 </div>
 <div className="bg-slate-50 p-6 rounded-lg">
 <h4 className="text-lg font-bold text-blue-900 mb-4">Terms</h4>
 <div className="space-y-2 text-sm">
 <p><strong>Contract Type:</strong> Professional</p>
 <p><strong>Status:</strong> {contract.signing_status || 'Pending Review'}</p>
 </div>
 </div>
 </div>

 {/* General Terms & Conditions */}
 <h3 className="text-xl font-bold text-blue-900 mb-6 pb-3 border-b-2 border-orange-500">
 General Terms & Conditions
 </h3>

 <div className="bg-slate-50 p-6 rounded-lg mb-8 space-y-4 text-sm">
 <p><strong>1. Contract Binding:</strong> This contract is legally binding upon both parties and governed by professional football league regulations.</p>
 
 <p><strong>2. Medical Requirements:</strong> Player must maintain physical fitness standards as defined by club medical staff and undergo regular medical examinations.</p>
 
 <p><strong>3. Training & Discipline:</strong> Player agrees to attend all scheduled training sessions, matches, and club activities unless excused by management for valid reasons.</p>
 
 <p><strong>4. Code of Conduct:</strong> Player must maintain professional behavior on and off the field, upholding the reputation and values of the club.</p>
 
 <p><strong>5. Anti-Drug Policy:</strong> Player commits to a drug-free lifestyle and agrees to support anti-drug campaigns as promoted by the Government of India and club initiatives.</p>
 
 <p><strong>6. Injury & Insurance:</strong> Club provides comprehensive medical coverage for football-related injuries during official training and matches.</p>
 
 <p><strong>7. Termination Clause:</strong> Either party may terminate this contract with 30 days written notice, subject to financial settlements as per league regulations.</p>
 
 <p><strong>8. Transfer Clause:</strong> Player transfers are subject to release clause payment and mutual agreement between all parties involved.</p>
 
 <p><strong>9. Intellectual Property:</strong> Any content created during employment (interviews, training videos, promotional materials) belongs to the club unless otherwise specified.</p>
 
 <p><strong>10. Compliance & Legal:</strong> Player agrees to comply with all applicable laws, regulations, and government policies, including Indian anti-drug legislation.</p>
 </div>

 {/* Anti-Drug Policy Highlight */}
 <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg mb-8">
 <h3 className="text-xl font-bold mb-4">🚫 ANTI-DRUG POLICY & COMPLIANCE</h3>
 <p className="mb-3">
 <strong>ZERO TOLERANCE POLICY:</strong> PCL maintains a strict zero-tolerance policy regarding the use, possession, distribution, or promotion of illegal drugs, narcotics, or banned substances.
 </p>
 <p className="mb-3">
 <strong>INDIAN GOVERNMENT COMPLIANCE:</strong> This contract is executed in full compliance with the Government of India's anti-drug initiatives and policies. The player acknowledges and supports the nation's efforts to maintain a drug-free society.
 </p>
 <p className="mb-3">
 <strong>MANDATORY TESTING:</strong> The player agrees to undergo regular drug testing as required by the club, league regulations, and government authorities.
 </p>
 <p>
 <strong>BREACH CONSEQUENCES:</strong> Any violation of this anti-drug policy will result in immediate contract termination, forfeiture of all benefits, and cooperation with law enforcement authorities as required by law.
 </p>
 </div>

 {/* Signature Section */}
 <h3 className="text-xl font-bold text-blue-900 mb-6 pb-3 border-b-2 border-orange-500">
 Contract Signatures
 </h3>

 <div className="grid md:grid-cols-2 gap-8 mb-8">
 {/* Club Signature */}
 <div className="text-center border-t-2 border-slate-300 pt-6">
 <div className="mb-8">
 {contract.club_signature_timestamp ? (
 <>
 <div className="inline-block bg-green-50 border-2 border-green-400 text-green-700 px-4 py-2 rounded-lg font-bold mb-4">
 ✓ Digitally Signed by Club
 </div>
 <p className="text-sm text-slate-600 mt-2">
 {contract.club_signature_name || 'Club Representative'}
 </p>
 <p className="text-xs text-slate-500 mt-1">
 Signed: {new Date(contract.club_signature_timestamp).toLocaleString()}
 </p>
 </>
 ) : (
 <p className="text-slate-500 italic">Awaiting club signature</p>
 )}
 </div>
 <p className="font-bold text-blue-900">{contract.clubs?.club_name}</p>
 <p className="text-sm text-slate-600">Club Representative</p>
 </div>

 {/* Player Signature */}
 <div className="text-center border-t-2 border-slate-300 pt-6">
 <div className="mb-8">
 {contract.player_signature_timestamp ? (
 <>
 <div className="inline-block bg-green-50 border-2 border-green-400 text-green-700 px-4 py-2 rounded-lg font-bold mb-4">
 ✓ Digitally Signed by Player
 </div>
 <p className="text-sm text-slate-600 mt-2">{playerName}</p>
 <p className="text-xs text-slate-500 mt-1">
 Signed: {new Date(contract.player_signature_timestamp).toLocaleString()}
 </p>
 </>
 ) : (
 <>
 <p className="text-slate-500 italic mb-4">Player signature required</p>
 {contract.status === 'pending' && !showSigningPanel && (
 <Button
 onClick={() => setShowSigningPanel(true)}
 className="bg-blue-600 hover:bg-blue-700"
 >
 Sign Contract
 </Button>
 )}
 </>
 )}
 </div>
 <p className="font-bold text-blue-900">{playerName}</p>
 <p className="text-sm text-slate-600">Professional Player</p>
 </div>
 </div>

 {/* Signing Panel */}
 {showSigningPanel && !contract.player_signature_timestamp && (
 <Card className="mb-8 border-2 border-blue-600 bg-blue-50">
 <CardHeader>
 <CardTitle className="text-blue-900">Sign Contract</CardTitle>
 <CardDescription>
 By signing this contract, you acknowledge and accept all terms and conditions
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-6">
 {/* Signature Input */}
 <div>
 <label className="block text-sm font-semibold text-slate-900 mb-2">
 Your Name (Digital Signature)
 </label>
 <input
 type="text"
 value={signature}
 onChange={(e) => setSignature(e.target.value)}
 placeholder="Type your full name here"
 className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
 />
 </div>

 {/* Date */}
 <div>
 <label className="block text-sm font-semibold text-slate-900 mb-2">
 Signing Date
 </label>
 <input
 type="date"
 value={signingDate}
 onChange={(e) => setSigningDate(e.target.value)}
 className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
 />
 </div>

 {/* Confirmation Text */}
 <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">
 <p className="text-sm text-yellow-900">
 <strong>⚠️ Important:</strong> By signing this contract, you confirm that you have read and understand all terms, including the anti-drug policy and compliance requirements. This signature is legally binding.
 </p>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-3">
 <Button
 onClick={handleSignContract}
 className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
 >
 ✓ Sign & Accept Contract
 </Button>
 <Button
 onClick={() => setShowSigningPanel(false)}
 variant="outline"
 className="flex-1"
 >
 Cancel
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Footer */}
 <div className="text-center text-xs text-slate-500 border-t pt-6">
 <p>This contract is governed by professional football league regulations</p>
 <p>Generated on {new Date().toLocaleDateString('en-IN')} | Contract ID: {contract.id.slice(0, 8).toUpperCase()}</p>
 <p>Professional Club League © 2025 | Drug-Free Sport Initiative</p>
 </div>
 </div>
 </div>

 {/* Actions */}
 {isFullPage && contract.status !== 'active' && (
 <div className="mt-8 flex gap-4 justify-center">
 <Button
 onClick={() => window.history.back()}
 variant="outline"
 className="px-8"
 >
 Back to Dashboard
 </Button>
 {contract.status === 'pending' && !contract.player_signature_timestamp && (
 <Button
 onClick={() => setShowSigningPanel(true)}
 className="px-8 bg-green-600 hover:bg-green-700"
 >
 Sign Contract
 </Button>
 )}
 </div>
 )}
 </div>
 </div>
 )
}

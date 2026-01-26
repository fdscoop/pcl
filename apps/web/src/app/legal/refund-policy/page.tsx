'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Mail, Phone, MapPin } from 'lucide-react'

export default function RefundPolicyPage() {
 const sections = [
 { id: 'overview', title: '1. Platform Role & Overview', icon: '📋' },
 { id: 'stadium', title: '2. Stadium Booking Refunds', icon: '🏟️' },
 { id: 'standards', title: '3. Minimum Refund Standards', icon: '✅' },
 { id: 'platform', title: '4. Platform-Guaranteed Refunds', icon: '🛡️' },
 { id: 'dispute', title: '5. Dispute Resolution', icon: '⚖️' },
 { id: 'process', title: '6. Refund Request Process', icon: '📝' },
 { id: 'tournament', title: '7. Tournament Registration Refunds', icon: '🏆' },
 { id: 'contact', title: '8. Contact Us', icon: '📞' },
 ]

 return (
 <div className="min-h-screen bg-background">
 {/* Header */}
 <div className="bg-gradient-to-r from-green-600/90 to-emerald-600/90">
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
 <div className="flex items-center gap-4 mb-6">
 <CreditCard className="w-10 h-10 text-foreground" />
 <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Refund Policy</h1>
 </div>
 <p className="text-lg sm:text-xl text-foreground max-w-2xl mb-8">
 Transparent cancellation and refund terms for Professional Club League (PCL) marketplace
 </p>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-foreground">
 <div>
 <p className="font-semibold">Company</p>
 <p>FDS COOP LLP</p>
 </div>
 <div>
 <p className="font-semibold">Startup ID</p>
 <p>DIPP69878</p>
 </div>
 <div>
 <p className="font-semibold">KSUM ID</p>
 <p>DIPP69878/2020/KSUM1031</p>
 </div>
 <div>
 <p className="font-semibold">Updated</p>
 <p>January 26, 2026</p>
 </div>
 </div>
 </div>
 </div>

 {/* Main Content with Sidebar */}
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
 {/* Sidebar Navigation */}
 <div className="lg:col-span-1">
 <div className="sticky top-20 bg-card rounded-lg border border-border p-4">
 <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
 Quick Navigation
 </h3>
 <nav className="space-y-2">
 {sections.map((section) => (
 <a
 key={section.id}
 href={`#${section.id}`}
 className="block text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 px-3 py-2 rounded-md transition-colors"
 >
 {section.title}
 </a>
 ))}
 </nav>
 </div>
 </div>

 {/* Main Content */}
 <div className="lg:col-span-3 space-y-8 text-foreground">
 {/* Overview */}
 <Card id="overview">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>📋</span>
 1. Platform Role & Overview
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">1.1 Our Role as Marketplace Facilitator</h4>
 <p className="text-foreground mb-3">
 FDS COOP LLP operates Professional Club League (PCL) as a <strong>marketplace facilitator</strong> that connects clubs with stadium owners for match bookings. We are not the service provider; we facilitate transactions between clubs (bookers) and stadium owners (service providers).
 </p>
 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
 <p className="text-blue-800 dark:text-blue-200 text-sm">
 <strong>Important:</strong> When you book a stadium through PCL, the contractual relationship for the booking exists between you (the club) and the stadium owner. We hold payments temporarily and facilitate the transaction.
 </p>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">1.2 Payment Holding & Release</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Payments are held securely by PCL until match completion</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Funds are released to stadium owners after successful match completion</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Refunds follow the stadium's cancellation policy displayed at booking</span>
 </li>
 </ul>
 </div>

 <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
 <p className="font-semibold text-accent">
 💡 All refund decisions for stadium bookings are made according to the specific stadium's cancellation policy, which you accept during the booking process. However, PCL enforces minimum standards and provides guarantees in specific scenarios (see sections 3 & 4).
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Stadium Bookings */}
 <Card id="stadium">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🏟️</span>
 2. Stadium Booking Cancellations & Refunds
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">2.1 Stadium-Specific Policies</h4>
 <p className="text-foreground mb-3">
 Each stadium on the PCL platform has its own cancellation and refund policy. These policies are:
 </p>
 <ul className="space-y-2 mb-4">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Clearly displayed</strong> on the stadium's listing page</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Shown during booking</strong> before payment confirmation</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Acknowledged by you</strong> when completing the booking</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Subject to PCL's minimum standards</strong> (see section 3)</span>
 </li>
 </ul>
 <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
 <p className="text-amber-800 dark:text-amber-200 text-sm">
 <strong>⚠️ Important:</strong> Always review the stadium's specific cancellation policy before booking. Refund eligibility and amounts are determined by the stadium owner's policy.
 </p>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">2.2 How Refunds Work</h4>
 <ol className="space-y-3 list-decimal list-inside">
 <li className="text-foreground">
 <strong>Club cancels booking:</strong> Refund (if any) is processed according to the stadium's policy
 </li>
 <li className="text-foreground">
 <strong>Refund calculation:</strong> Stadium owner determines refund amount based on their policy
 </li>
 <li className="text-foreground">
 <strong>Processing:</strong> PCL processes the refund within 5-7 business days after approval
 </li>
 <li className="text-foreground">
 <strong>Payment method:</strong> Refunds are issued to the original payment method
 </li>
 </ol>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">2.3 Refund Timeline Examples</h4>
 <p className="text-foreground mb-3 text-sm italic">
 Note: These are examples only. Actual refund terms depend on the specific stadium's policy.
 </p>
 <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
 <div className="flex justify-between items-center text-sm">
 <span className="text-muted-foreground">Typical cancellation timeline:</span>
 <span className="font-semibold text-foreground">Refund %</span>
 </div>
 <div className="flex justify-between items-center text-sm border-t pt-2">
 <span className="text-foreground">48+ hours before match</span>
 <span className="font-semibold text-green-600">80-100%</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-foreground">24-48 hours before match</span>
 <span className="font-semibold text-amber-600">50-80%</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-foreground">Less than 24 hours</span>
 <span className="font-semibold text-red-600">0-50%</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Minimum Standards */}
 <Card id="standards">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>✅</span>
 3. Minimum Refund Standards Enforced by PCL
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <p className="text-foreground">
 To protect clubs and ensure fair practices, PCL enforces the following <strong>minimum standards</strong> that all stadiums must meet:
 </p>
 
 <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-r-lg">
 <h4 className="font-semibold mb-3 text-green-800 dark:text-green-200">Mandatory Minimum Refund Requirements</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-green-600 font-bold">✓</span>
 <span className="text-foreground"><strong>48+ hours notice:</strong> Minimum 80% refund (processing fees may apply)</span>
 </li>
 <li className="flex gap-3">
 <span className="text-green-600 font-bold">✓</span>
 <span className="text-foreground"><strong>24-48 hours notice:</strong> Minimum 50% refund</span>
 </li>
 <li className="flex gap-3">
 <span className="text-green-600 font-bold">✓</span>
 <span className="text-foreground"><strong>Documented emergencies:</strong> Full refund consideration regardless of timing</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">3.1 What Qualifies as Emergency</h4>
 <p className="text-foreground mb-3">Full refund consideration for documented cases of:</p>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Medical emergencies (hospitalization, serious illness)</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Natural disasters or extreme weather events</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Government restrictions or emergency orders</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Death in immediate family</span>
 </li>
 </ul>
 <p className="text-sm text-muted-foreground mt-3 italic">
 * Documentation required (medical certificates, official notifications, etc.)
 </p>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">3.2 Stadium Compliance</h4>
 <p className="text-foreground">
 Stadiums that consistently violate PCL's minimum refund standards may be removed from the platform. 
 We regularly review stadium policies and club feedback to ensure compliance.
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Platform Guarantees */}
 <Card id="platform">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🛡️</span>
 4. Platform-Guaranteed Refunds
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <p className="text-foreground mb-4">
 PCL <strong>guarantees full refunds</strong> in the following scenarios, regardless of the stadium's cancellation policy:
 </p>

 <div className="space-y-4">
 <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
 <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">4.1 Stadium Unavailability (Stadium's Fault)</h4>
 <ul className="space-y-2 text-foreground">
 <li className="flex gap-3">
 <span className="text-blue-600 font-bold">→</span>
 <span>Stadium is closed or unavailable on booking date</span>
 </li>
 <li className="flex gap-3">
 <span className="text-blue-600 font-bold">→</span>
 <span>Facility maintenance not communicated in advance</span>
 </li>
 <li className="flex gap-3">
 <span className="text-blue-600 font-bold">→</span>
 <span>Stadium infrastructure failure (lights, surface, etc.)</span>
 </li>
 </ul>
 <p className="mt-3 font-semibold text-blue-800 dark:text-blue-200">
 → Refund: 100% + Potential compensation
 </p>
 </div>

 <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
 <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">4.2 Technical Issues (PCL Platform)</h4>
 <ul className="space-y-2 text-foreground">
 <li className="flex gap-3">
 <span className="text-purple-600 font-bold">→</span>
 <span>Payment processing errors</span>
 </li>
 <li className="flex gap-3">
 <span className="text-purple-600 font-bold">→</span>
 <span>Platform malfunction leading to incorrect booking</span>
 </li>
 <li className="flex gap-3">
 <span className="text-purple-600 font-bold">→</span>
 <span>Double booking due to system error</span>
 </li>
 </ul>
 <p className="mt-3 font-semibold text-purple-800 dark:text-purple-200">
 → Refund: 100%
 </p>
 </div>

 <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
 <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">4.3 Policy Violations by Stadium</h4>
 <ul className="space-y-2 text-foreground">
 <li className="flex gap-3">
 <span className="text-red-600 font-bold">→</span>
 <span>Stadium refuses to honor their stated cancellation policy</span>
 </li>
 <li className="flex gap-3">
 <span className="text-red-600 font-bold">→</span>
 <span>Stadium changes policy after booking without consent</span>
 </li>
 <li className="flex gap-3">
 <span className="text-red-600 font-bold">→</span>
 <span>Stadium violates PCL's minimum standards</span>
 </li>
 </ul>
 <p className="mt-3 font-semibold text-red-800 dark:text-red-200">
 → Refund: As per policy or 100% if policy violated
 </p>
 </div>
 </div>

 <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
 <p className="text-green-800 dark:text-green-200 font-semibold">
 ✓ Protection Guarantee: If a stadium owner refuses a legitimate refund, PCL will process the refund 
 from our own funds and resolve the matter with the stadium separately.
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Dispute Resolution */}
 <Card id="dispute">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>⚖️</span>
 5. Dispute Resolution Process
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">5.1 When to Raise a Dispute</h4>
 <p className="text-foreground mb-3">Contact our support team if:</p>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Stadium refuses to process refund according to their policy</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">You believe minimum standards were violated</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Stadium unavailable on booking date</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Facility does not match description or photos</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">5.2 Dispute Resolution Timeline</h4>
 <div className="space-y-3">
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
 <span className="text-blue-600 font-bold text-sm">1</span>
 </div>
 <div className="flex-1">
 <p className="font-semibold text-foreground">Raise Dispute (Within 48 hours)</p>
 <p className="text-sm text-muted-foreground">Contact support with booking details and issue</p>
 </div>
 </div>
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
 <span className="text-blue-600 font-bold text-sm">2</span>
 </div>
 <div className="flex-1">
 <p className="font-semibold text-foreground">Investigation (1-3 business days)</p>
 <p className="text-sm text-muted-foreground">We review evidence from both parties</p>
 </div>
 </div>
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
 <span className="text-blue-600 font-bold text-sm">3</span>
 </div>
 <div className="flex-1">
 <p className="font-semibold text-foreground">Resolution (2-5 business days)</p>
 <p className="text-sm text-muted-foreground">Decision communicated and refund processed if applicable</p>
 </div>
 </div>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">5.3 Evidence Requirements</h4>
 <p className="text-foreground mb-3">To support your dispute, please provide:</p>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Booking confirmation and transaction details</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Communication with stadium owner (if any)</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Photos or documentation of the issue</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Relevant emergency documentation (if applicable)</span>
 </li>
 </ul>
 </div>

 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
 <p className="text-blue-800 dark:text-blue-200">
 <strong>Fair Resolution Commitment:</strong> PCL acts as a neutral mediator. Our decisions are based on 
 platform policies, stadium agreements, and evidence provided. We aim for fair outcomes for all parties.
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Refund Process */}
 <Card id="process">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>📝</span>
 6. Refund Request Process
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">6.1 How to Request a Refund</h4>
 <ol className="space-y-3 list-decimal list-inside">
 <li className="text-foreground">
 <strong>For Stadium Bookings:</strong> Check stadium's cancellation policy on your booking confirmation
 </li>
 <li className="text-foreground">
 <strong>Initiate Request:</strong> Go to your booking and click "Cancel/Request Refund"
 </li>
 <li className="text-foreground">
 <strong>Provide Reason:</strong> Select cancellation reason and provide details
 </li>
 <li className="text-foreground">
 <strong>Upload Documentation:</strong> If claiming emergency, upload supporting documents
 </li>
 <li className="text-foreground">
 <strong>Review:</strong> Stadium owner or PCL reviews request within 24-48 hours
 </li>
 <li className="text-foreground">
 <strong>Processing:</strong> Approved refunds processed within 5-7 business days
 </li>
 </ol>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">6.2 Refund Methods</h4>
 <p className="text-foreground mb-3">Refunds are issued to the original payment method:</p>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Credit/Debit Card:</strong> 5-10 business days</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>UPI/Digital Wallets:</strong> 3-5 business days</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Net Banking:</strong> 3-7 business days</span>
 </li>
 </ul>
 <p className="text-sm text-muted-foreground mt-3 italic">
 * Timeline starts after refund approval, not request date
 </p>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">6.3 Refund Status Tracking</h4>
 <p className="text-foreground">
 Track your refund status in real-time through your dashboard under "My Transactions". 
 You'll receive email notifications at each stage of the refund process.
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Tournament Fees */}
 <Card id="tournament">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🏆</span>
 7. Tournament Registration Refunds
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <p className="text-foreground">
 Tournament registration refunds are managed by PCL directly (not subject to organizer policies).
 </p>
 
 <div>
 <h4 className="font-semibold mb-3 text-foreground">7.1 Standard Cancellation Timeline</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>7+ days before tournament:</strong> 90% refund (10% admin fee)</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>3-7 days before tournament:</strong> 75% refund</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>1-3 days before tournament:</strong> 50% refund</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Day of or after start:</strong> No refund</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">7.2 Tournament Cancellation by Organizer</h4>
 <p className="text-foreground mb-3">
 If PCL or the organizer cancels a tournament:
 </p>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-green-600 font-bold">✓</span>
 <span className="text-foreground">100% refund to all registered teams</span>
 </li>
 <li className="flex gap-3">
 <span className="text-green-600 font-bold">✓</span>
 <span className="text-foreground">No admin or processing fees deducted</span>
 </li>
 <li className="flex gap-3">
 <span className="text-green-600 font-bold">✓</span>
 <span className="text-foreground">Processed within 7 business days</span>
 </li>
 </ul>
 </div>

 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
 <p className="text-blue-800 dark:text-blue-200 text-sm">
 <strong>Note:</strong> Some tournaments may have custom refund policies due to unique 
 arrangements (venue deposits, equipment rentals, etc.). These will be clearly displayed 
 during registration.
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Contact Information */}
 <Card id="contact">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>📞</span>
 8. Contact Us
 </CardTitle>
 </CardHeader>
 <CardContent className="text-foreground">
 <p className="mb-6 text-foreground">For refund requests, disputes, or questions about this policy:</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="flex gap-3">
 <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">Email Support</p>
 <p className="text-foreground">support@professionalclubleague.com</p>
 <p className="text-foreground text-sm">fdscoop@gmx.com</p>
 </div>
 </div>
 <div className="flex gap-3">
 <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">Phone</p>
 <p className="text-foreground">+91 6282829881</p>
 <p className="text-sm text-muted-foreground">Mon-Sat: 9 AM - 6 PM IST</p>
 </div>
 </div>
 <div className="flex gap-3 sm:col-span-2">
 <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">Registered Office</p>
 <p className="text-foreground">FDS COOP LLP</p>
 <p className="text-foreground">Kolichal PO, Kanhangad</p>
 <p className="text-foreground">Kasaragod, Kerala 671312, India</p>
 </div>
 </div>
 <div className="flex gap-3 sm:col-span-2">
 <CreditCard className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground mb-2">Company Information</p>
 <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-foreground">
 <span className="text-muted-foreground">Company:</span>
 <span>FDS COOP LLP</span>
 <span className="text-muted-foreground">Product:</span>
 <span>Professional Club League (PCL)</span>
 <span className="text-muted-foreground">Startup ID:</span>
 <span>DIPP69878</span>
 <span className="text-muted-foreground">KSUM ID:</span>
 <span>DIPP69878/2020/KSUM1031</span>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
 <p className="text-green-800 dark:text-green-200 text-sm">
 <strong>Need Immediate Help?</strong> For urgent refund issues or disputes during live match days, 
 call our support line. Average response time for refund emails is 24-48 hours.
 </p>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>

 {/* Back to Top Button */}
 <div className="flex justify-center mt-16">
 <Button 
 variant="outline"
 onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
 >
 ↑ Back to Top
 </Button>
 </div>
 </div>
 </div>
 )
}
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Mail, Phone, MapPin } from 'lucide-react'

export default function RefundPolicyPage() {
 const sections = [
 { id: 'overview', title: '1. Policy Overview', icon: '📋' },
 { id: 'stadium', title: '2. Stadium Booking Refunds', icon: '🏟️' },
 { id: 'tournament', title: '3. Tournament Registration Refunds', icon: '🏆' },
 { id: 'membership', title: '4. Membership & Subscription Refunds', icon: '💳' },
 { id: 'services', title: '5. Service & Processing Fees', icon: '⚙️' },
 { id: 'process', title: '6. Refund Request Process', icon: '📝' },
 { id: 'special', title: '7. Special Circumstances', icon: '⚠️' },
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
 Fair and transparent refund terms for all PCL platform services
 </p>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-foreground">
 <div>
 <p className="font-semibold">Company</p>
 <p>Professional Club League</p>
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
 <p>Dec 25, 2025</p>
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
 1. Policy Overview
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 text-foreground">
 <p className="text-foreground">
 Professional Club League (PCL) is committed to providing fair and transparent refund policies 
 for all services offered on our platform. This policy outlines the conditions under which 
 refunds may be requested and processed.
 </p>
 <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
 <p className="font-semibold text-accent">
 💡 All refund requests are subject to review and approval by our support team. Processing times 
 may vary depending on the payment method and financial institution.
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Stadium Bookings */}
 <Card id="stadium">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🏟️</span>
 2. Stadium Booking Refunds
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">2.1 Cancellation Timeline</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>48+ hours before booking:</strong> 100% refund minus processing fees</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>24-48 hours before booking:</strong> 75% refund</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>12-24 hours before booking:</strong> 50% refund</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Less than 12 hours:</strong> No refund</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">2.2 Stadium Cancellation Policy</h4>
 <p className="text-foreground mb-3">
 Stadium booking cancellations and refunds are subject to the specific stadium's cancellation policy. 
 Each stadium owner may have their own cancellation terms that may be more favorable than the above timeline.
 </p>
 <p className="text-foreground font-semibold text-accent mb-2">
 Cancellation fees charged by the stadium owner will be deducted from the refund amount.
 </p>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">2.3 Exceptional Circumstances</h4>
 <p className="text-foreground mb-2">Full refunds may be provided in cases of:</p>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Weather-related cancellations</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Stadium facility unavailability or maintenance</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Government restrictions or emergency orders</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Documented medical emergencies</span>
 </li>
 </ul>
 </div>
 </CardContent>
 </Card>

 {/* Tournament Fees */}
 <Card id="tournament">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🏆</span>
 3. Tournament Registration Refunds
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">3.1 Pre-Tournament Cancellation by Team</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>7+ days before tournament:</strong> 90% refund</span>
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
 <span className="text-foreground"><strong>Day of tournament or after commencement:</strong> No refund</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">3.2 Tournament Cancellation Policy</h4>
 <p className="text-foreground mb-3">
 Tournament registration fee refunds are subject to the specific tournament's cancellation policy 
 as set by the tournament organizer. Additional cancellation fees charged by the organizer may apply 
 and will be deducted from the refund amount.
 </p>
 <p className="text-foreground font-semibold text-accent">
 Tournament-specific cancellation fees may reduce the refund percentage.
 </p>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">3.3 Tournament Cancellation by Organizer</h4>
 <p className="text-foreground">
 If a tournament is cancelled by the organizer or PCL, all participants will receive a 100% refund 
 of registration fees within 7-10 business days.
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Membership Fees */}
 <Card id="membership">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>💳</span>
 4. Membership & Subscription Refunds
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">4.1 Subscription Refund Terms</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Monthly subscriptions:</strong> Limited refund if cancelled within 7 days of purchase (prorated for unused portion)</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Annual subscriptions:</strong> Limited refund if cancelled within 30 days of purchase (prorated for unused portion)</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Used benefits:</strong> Refund amount will be adjusted based on utilized features and services</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">4.2 Membership Fees - Non-Refundable Policy</h4>
 <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
 <p className="text-red-700 font-semibold">
 ✗ Membership and subscription fees are generally NON-REFUNDABLE once purchased, except in the following cases:
 </p>
 </div>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Service Not Provided:</strong> Full refund if PCL fails to provide the promised service or platform is unavailable for 7+ consecutive days</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Permanent Relocation:</strong> Prorated refund with proof of address change (only for location-specific memberships)</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Medical Hardship:</strong> Case-by-case basis with medical documentation</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Account Closure by PCL:</strong> Full refund for unused portion if account terminated by PCL</span>
 </li>
 </ul>
 </div>
 </CardContent>
 </Card>

 {/* Service & Processing Fees */}
 <Card id="services">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>⚙️</span>
 5. Service & Processing Fees
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">5.1 Non-Refundable Fees</h4>
 <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
 <p className="text-red-700 font-semibold">
 ✗ The following fees are NEVER refundable:
 </p>
 </div>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Payment processing charges (2-3% of transaction)</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">KYC verification fees</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Document processing charges</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Administrative or platform service fees</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Referee assignment fees</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">5.2 Refundable Services (Conditional)</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Premium Features:</strong> Refundable if service is not provided or technical issues prevent usage</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Featured Listings:</strong> Refundable if display technical issues occur and are not resolved within 24 hours</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Premium Support:</strong> Full refund within 48 hours of purchase if no support tickets accessed</span>
 </li>
 </ul>
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
 <ol className="space-y-2">
 {[
 'Log into your PCL account',
 'Navigate to "My Transactions" or "Billing History"',
 'Select the transaction you wish to refund',
 'Click "Request Refund" and provide detailed reason',
 'Submit any required documentation (screenshots, proof, etc.)',
 'Await review and approval notification'
 ].map((step, idx) => (
 <li key={idx} className="flex gap-3">
 <span className="text-accent font-bold">{idx + 1}.</span>
 <span className="text-foreground">{step}</span>
 </li>
 ))}
 </ol>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">6.2 Processing Timeline</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Review period:</strong> 2-5 business days</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Credit card refunds:</strong> 5-10 business days after approval</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Bank transfer refunds:</strong> 3-7 business days after approval</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Digital wallet refunds:</strong> 1-3 business days after approval</span>
 </li>
 </ul>
 </div>
 </CardContent>
 </Card>

 {/* Special Circumstances */}
 <Card id="special">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>⚠️</span>
 7. Special Circumstances
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">7.1 Force Majeure Events</h4>
 <p className="text-foreground mb-3">
 In cases of natural disasters, pandemics, government restrictions, or other unforeseeable 
 circumstances, PCL will work with users to provide fair resolutions, which may include:
 </p>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Full refunds regardless of standard policy timeline</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Credit towards future bookings or services</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Rescheduling options without additional charges</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">7.2 Dispute Resolution</h4>
 <p className="text-foreground">
 If you disagree with a refund decision, you may appeal by contacting our customer service 
 team within 30 days with additional documentation or circumstances supporting your request.
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
 <p className="mb-6 text-foreground">For refund requests or questions about this policy:</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="flex gap-3">
 <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">Email</p>
 <p className="text-foreground">support@professionalclubleague.com</p>
 </div>
 </div>
 <div className="flex gap-3">
 <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">Phone</p>
 <p className="text-foreground">+91 6282829881</p>
 </div>
 </div>
 <div className="flex gap-3 sm:col-span-2">
 <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">Address</p>
 <p className="text-foreground">FDS COOP LLP</p>
 <p className="text-foreground">AKG Nagar, 18th Mile</p>
 <p className="text-foreground">Kanhangad, Kasaragod</p>
 <p className="text-foreground">Kerala, India 671532</p>
 </div>
 </div>
 <div className="flex gap-3 sm:col-span-2">
 <div className="flex-1">
 <p className="font-semibold text-sm text-muted-foreground mb-2">Business Hours & Info</p>
 <p className="text-sm text-foreground"><strong>Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM IST</p>
 <p className="text-sm text-foreground"><strong>Startup ID:</strong> DIPP69878</p>
 <p className="text-sm text-foreground"><strong>KSUM ID:</strong> DIPP69878/2020/KSUM1031</p>
 <p className="text-sm text-foreground"><strong>Response Time:</strong> 24-48 hours for emails</p>
 </div>
 </div>
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
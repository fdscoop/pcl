'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Mail, Phone, MapPin } from 'lucide-react'

export default function MembershipPoliciesPage() {
 const sections = [
 { id: 'overview', title: '1. Membership Overview', icon: '📋' },
 { id: 'players', title: '2. Player Membership', icon: '⚽' },
 { id: 'clubs', title: '3. Club Membership', icon: '🏛️' },
 { id: 'stadiums', title: '4. Stadium Owner Membership', icon: '🏟️' },
 { id: 'referees', title: '5. Referee & Officials', icon: '🏆' },
 { id: 'staff', title: '6. Staff & Volunteers', icon: '👥' },
 { id: 'fees', title: '7. Membership Fees', icon: '💳' },
 { id: 'support', title: '8. Contact Support', icon: '📞' },
 ]

 return (
 <div className="min-h-screen bg-background">
 <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90">
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
 <div className="flex items-center gap-4 mb-6">
 <Users className="w-10 h-10 text-foreground" />
 <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Membership Policies</h1>
 </div>
 <p className="text-lg sm:text-xl text-foreground max-w-2xl mb-8">
 Comprehensive membership guidelines and pricing for all PCL user categories
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

 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

 <div className="lg:col-span-3 space-y-8">
 <Card id="overview">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>📋</span>
 1. Membership Overview
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 text-foreground">
 <p>Professional Club League (PCL) offers various membership categories designed to serve different participants in the sports ecosystem. Each membership type has specific privileges, responsibilities, and fee structures.</p>
 <p>All members must comply with PCL's Terms and Conditions, Code of Conduct, and applicable sports regulations.</p>
 </CardContent>
 </Card>

 <Card id="players">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>⚽</span>
 2. Player Membership
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3">2.1 Membership Fee</h4>
 <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-3">
 <p className="text-lg font-bold text-accent">₹75 per month</p>
 <p className="text-sm mt-2">Renewable on a monthly basis</p>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-3">2.2 Eligibility Requirements</h4>
 <ul className="space-y-2">
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Minimum age: 16 years (with parental consent for minors)</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Valid government-issued identification</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Completed health and fitness declaration</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Signed liability waiver and code of conduct agreement</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Verification of previous playing experience (if applicable)</span></li>
 </ul>
 </div>
 </CardContent>
 </Card>

 <Card id="clubs">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>��️</span>
 3. Club Membership
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3">3.1 Membership Fee</h4>
 <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-3">
 <p className="text-lg font-bold text-accent">₹250 per month</p>
 <p className="text-sm mt-2">Renewable on a monthly basis | Annual option available with discount</p>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-3">3.2 Club Registration Requirements</h4>
 <ul className="space-y-2">
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Legal business registration or sports association certification</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Designated authorized signatory for contracts</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Valid insurance coverage for players and facilities</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Compliance with local sports authority regulations</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Financial capacity verification for player contracts</span></li>
 </ul>
 </div>
 </CardContent>
 </Card>

 <Card id="stadiums">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🏟️</span>
 4. Stadium Owner Membership
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3">4.1 Commission Structure</h4>
 <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-3">
 <p className="text-lg font-bold text-accent">10% Commission on Payout</p>
 <p className="text-sm mt-2">Includes:</p>
 <ul className="space-y-1 mt-2 text-sm">
 <li>✓ Payment gateway charges</li>
 <li>✓ GST (Goods and Services Tax)</li>
 <li>✓ Processing charges</li>
 </ul>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-3">4.2 No Monthly Membership Fee</h4>
 <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
 <p className="font-semibold text-green-700">✓ Stadium owners do not pay monthly membership fees</p>
 <p className="text-sm text-green-700 mt-2">You only pay the 10% commission when you receive payouts</p>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card id="referees">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🏆</span>
 5. Referee & Officials Membership
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3">5.1 No Membership Fee</h4>
 <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
 <p className="font-semibold text-green-700">✓ FREE membership for all referees and officials</p>
 <p className="text-sm text-green-700 mt-2">No monthly or annual fees required</p>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-3">5.2 Certification Requirements</h4>
 <ul className="space-y-2">
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Valid officiating license from recognized sports authority</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Completed referee training and education programs</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Physical fitness certification</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Background check and character verification</span></li>
 </ul>
 </div>
 </CardContent>
 </Card>

 <Card id="staff">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>👥</span>
 6. Staff & Volunteer Membership
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3">6.1 No Membership Fee</h4>
 <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
 <p className="font-semibold text-green-700">✓ FREE membership for all staff and volunteers</p>
 <p className="text-sm text-green-700 mt-2">No fees or charges for joining and participating</p>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-3">6.2 Categories</h4>
 <ul className="space-y-2">
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span><strong>Event Staff:</strong> Tournament organizers, coordinators, technical support</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span><strong>Medical Personnel:</strong> Doctors, physiotherapists, first aid providers</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span><strong>Support Staff:</strong> Groundskeepers, equipment managers, security</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span><strong>Volunteers:</strong> Community supporters, student assistants, retirees</span></li>
 <li className="flex gap-3"><span className="text-accent font-bold">•</span><span><strong>Media Personnel:</strong> Photographers, journalists, broadcasters</span></li>
 </ul>
 </div>
 </CardContent>
 </Card>

 <Card id="fees">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>💳</span>
 7. Membership Fees Summary
 </CardTitle>
 </CardHeader>
 <CardContent className="text-foreground">
 <div className="space-y-4">
 <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
 <h4 className="font-semibold mb-3">Fee Structure</h4>
 <div className="space-y-3">
 <div className="flex justify-between items-start pb-3 border-b border-accent/20">
 <div>
 <p className="font-semibold">⚽ Player Membership</p>
 <p className="text-sm text-muted-foreground">Monthly subscription</p>
 </div>
 <p className="text-lg font-bold text-accent">₹75/month</p>
 </div>

 <div className="flex justify-between items-start pb-3 border-b border-accent/20">
 <div>
 <p className="font-semibold">🏛️ Club Membership</p>
 <p className="text-sm text-muted-foreground">Monthly subscription</p>
 </div>
 <p className="text-lg font-bold text-accent">₹250/month</p>
 </div>

 <div className="flex justify-between items-start pb-3 border-b border-accent/20">
 <div>
 <p className="font-semibold">🏟️ Stadium Owner Membership</p>
 <p className="text-sm text-muted-foreground">10% commission on payouts</p>
 </div>
 <p className="text-lg font-bold text-accent">10% + GST</p>
 </div>

 <div className="flex justify-between items-start pb-3 border-b border-accent/20">
 <div>
 <p className="font-semibold">🏆 Referee & Officials</p>
 <p className="text-sm text-muted-foreground">No fees</p>
 </div>
 <p className="text-lg font-bold text-green-600">FREE</p>
 </div>

 <div className="flex justify-between items-start">
 <div>
 <p className="font-semibold">👥 Staff & Volunteers</p>
 <p className="text-sm text-muted-foreground">No fees</p>
 </div>
 <p className="text-lg font-bold text-green-600">FREE</p>
 </div>
 </div>
 </div>

 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
 <h4 className="font-semibold text-blue-900 mb-2">💡 About Stadium Commission</h4>
 <ul className="space-y-1 text-sm text-blue-900">
 <li>✓ No monthly membership fee for stadium owners</li>
 <li>✓ 10% commission applies only on successful payouts</li>
 <li>✓ Includes payment gateway charges, GST & processing fees</li>
 <li>✓ Transparent and fair pricing model</li>
 </ul>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card id="support">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>📞</span>
 8. Contact & Support
 </CardTitle>
 </CardHeader>
 <CardContent className="text-foreground">
 <p className="mb-6">For membership inquiries, applications, or support:</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="flex gap-3">
 <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">Membership Email</p>
 <p>membership@professionalclubleague.com</p>
 </div>
 </div>
 <div className="flex gap-3">
 <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">General Support</p>
 <p>support@professionalclubleague.com</p>
 </div>
 </div>
 <div className="flex gap-3">
 <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">Phone</p>
 <p>+91 6282829881</p>
 </div>
 </div>
 <div className="flex gap-3">
 <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-semibold text-sm text-muted-foreground">Address</p>
 <p>FDS COOP LLP</p>
 <p>AKG Nagar, 18th Mile</p>
 <p>Kanhangad, Kasaragod</p>
 </div>
 </div>
 <div className="sm:col-span-2">
 <p className="font-semibold text-sm text-muted-foreground mb-2">Business Hours</p>
 <p>Monday-Friday: 9:00 AM - 6:00 PM IST</p>
 <p>Response time: 24-48 hours</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>

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

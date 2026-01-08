'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Mail, Phone, MapPin } from 'lucide-react'

export default function PrivacyPolicyPage() {
 const sections = [
 { id: 'introduction', title: '1. Introduction', icon: '📋' },
 { id: 'information', title: '2. Information We Collect', icon: '📊' },
 { id: 'usage', title: '3. How We Use Your Information', icon: '🎯' },
 { id: 'sharing', title: '4. Information Sharing', icon: '🔗' },
 { id: 'security', title: '5. Data Security', icon: '🔒' },
 { id: 'rights', title: '6. Your Rights', icon: '⚖️' },
 { id: 'contact', title: '7. Contact Us', icon: '📞' },
 { id: 'updates', title: '8. Policy Updates', icon: '🔄' },
 ]

 return (
 <div className="min-h-screen bg-background">
 {/* Header */}
 <div className="bg-gradient-to-r from-primary/90 to-accent/90">
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
 <div className="flex items-center gap-4 mb-6">
 <Shield className="w-10 h-10 text-foreground" />
 <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Privacy Policy</h1>
 </div>
 <p className="text-lg sm:text-xl text-foreground max-w-2xl mb-8">
 How we collect, use, and protect your personal information
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
 {/* Introduction */}
 <Card id="introduction">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>📋</span>
 1. Introduction
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 text-foreground">
 <p className="text-foreground">
 Professional Club League ("PCL", "we", "our", or "us") is committed to protecting your privacy. 
 This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
 you visit our platform and use our sports management services.
 </p>
 <p className="text-foreground">
 PCL is a registered startup under the Department for Promotion of Industry and Internal Trade (DIPP) 
 with Startup ID: DIPP69878 and KSUM ID: DIPP69878/2020/KSUM1031.
 </p>
 </CardContent>
 </Card>

 {/* Information We Collect */}
 <Card id="information">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>📊</span>
 2. Information We Collect
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">2.1 Personal Information</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Account Information:</strong> Name, email address, phone number, date of birth</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Profile Information:</strong> Profile photos, bio, sports preferences</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Identity Verification:</strong> KYC documents, government-issued IDs</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Payment Information:</strong> Billing address, payment method details (processed securely by third-party providers)</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">2.2 Sports-Specific Information</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Player Data:</strong> Position, statistics, match history, performance metrics</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Club Data:</strong> Club details, team rosters, match schedules</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Stadium Data:</strong> Venue information, booking details, availability</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Tournament Data:</strong> Participation records, results, rankings</span>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-3 text-foreground">2.3 Technical Information</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">IP address, browser type, device information</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Usage data, session information, cookies</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Location data (with your permission)</span>
 </li>
 </ul>
 </div>
 </CardContent>
 </Card>

 {/* How We Use Information */}
 <Card id="usage">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🎯</span>
 3. How We Use Your Information
 </CardTitle>
 </CardHeader>
 <CardContent className="text-foreground">
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Provide and maintain our sports management platform</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Process registrations, bookings, and payments</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Facilitate player scouting and club management</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Organize tournaments and match scheduling</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Verify user identity and prevent fraud</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Send important notifications and updates</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Improve our services and user experience</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Comply with legal obligations and regulations</span>
 </li>
 </ul>
 </CardContent>
 </Card>

 {/* Information Sharing */}
 <Card id="sharing">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🔗</span>
 4. Information Sharing and Disclosure
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6 text-foreground">
 <div>
 <h4 className="font-semibold mb-3 text-foreground">4.1 We may share your information with:</h4>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Other Users:</strong> Profile information visible to clubs, players, and scouts</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Service Providers:</strong> Third-party vendors who assist our operations</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Payment Processors:</strong> Secure payment gateways for transactions</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground"><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</span>
 </li>
 </ul>
 </div>
 <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
 <p className="font-semibold text-accent">✓ We do NOT sell your personal information to third parties.</p>
 </div>
 </CardContent>
 </Card>

 {/* Data Security */}
 <Card id="security">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🔒</span>
 5. Data Security
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 text-foreground">
 <p className="text-foreground">
 We implement appropriate technical and organizational measures to protect your personal information:
 </p>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Encryption of data in transit and at rest</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Regular security assessments and updates</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Access controls and authentication measures</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Secure cloud infrastructure and backup systems</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Staff training on data protection practices</span>
 </li>
 </ul>
 </CardContent>
 </Card>

 {/* Your Rights */}
 <Card id="rights">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>⚖️</span>
 6. Your Rights
 </CardTitle>
 </CardHeader>
 <CardContent className="text-foreground">
 <p className="mb-4 text-foreground">You have the right to:</p>
 <ul className="space-y-2">
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Access and review your personal information</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Update or correct inaccurate information</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Request deletion of your account and data</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Opt-out of marketing communications</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">Data portability (receive your data in a structured format)</span>
 </li>
 <li className="flex gap-3">
 <span className="text-accent font-bold">•</span>
 <span className="text-foreground">File complaints with data protection authorities</span>
 </li>
 </ul>
 </CardContent>
 </Card>

 {/* Contact Information */}
 <Card id="contact">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>📞</span>
 7. Contact Us
 </CardTitle>
 </CardHeader>
 <CardContent className="text-foreground">
 <p className="mb-6 text-foreground">For privacy-related questions or concerns, contact us at:</p>
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
 <p className="font-semibold text-sm text-muted-foreground mb-2">Company & Identifiers</p>
 <p className="text-sm text-foreground"><strong>Company:</strong> FDS COOP LLP</p>
 <p className="text-sm text-foreground"><strong>Website:</strong> professionalclubleague.com</p>
 <p className="text-sm text-foreground"><strong>Startup ID:</strong> DIPP69878</p>
 <p className="text-sm text-foreground"><strong>KSUM ID:</strong> DIPP69878/2020/KSUM1031</p>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Policy Updates */}
 <Card id="updates">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span>🔄</span>
 8. Policy Updates
 </CardTitle>
 </CardHeader>
 <CardContent className="text-foreground">
 <p className="text-foreground">
 We may update this Privacy Policy from time to time. We will notify you of any changes by 
 posting the new Privacy Policy on this page and updating the "Last updated" date. 
 Continued use of our services after changes constitutes acceptance of the updated policy.
 </p>
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
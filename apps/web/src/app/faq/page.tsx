import { Metadata } from 'next'
import Image from 'next/image'
import { Search } from 'lucide-react'
import FAQContent from '@/components/FAQContent'

export const metadata: Metadata = {
 title: 'Frequently Asked Questions | PCL Championship',
 description: 'Find answers to common questions about Professional Club League - India\'s premier sports management platform for football clubs, players, and tournaments.',
}

const faqs = [
 {
 category: 'Getting Started',
 questions: [
 {
 q: 'What is Professional Club League (PCL)?',
 a: 'PCL is India\'s premier sports management platform connecting players, clubs, tournaments, and stadiums. We provide digital infrastructure for grassroots to professional football including player profiles, club management, digital contracts, and tournament organization.'
 },
 {
 q: 'How do I create an account?',
 a: 'Click "Sign Up" in the top navigation, choose your role (player, club owner, referee, etc.), and complete the registration form. All users require a membership plan - Players pay ₹75/month, while clubs pay ₹250/month for full access to platform features.'
 },
 {
 q: 'Is PCL free to use?',
 a: 'PCL requires membership for full access. Players can sign up for ₹75/month, while club owners need a ₹250/month subscription to access club management features. Referees and staff have their own plans.'
 }
 ]
 },
 {
 category: 'For Players',
 questions: [
 {
 q: 'How do I join a club?',
 a: 'Browse available clubs, view their profiles, and apply to join. Clubs can also scout and invite you directly. Once accepted, you\'ll sign a digital contract through the platform.'
 },
 {
 q: 'Can I play for multiple clubs?',
 a: 'Active contracts are exclusive, but you can have multiple contracts across different time periods. Make sure to review contract terms and end dates.'
 },
 {
 q: 'How are my statistics tracked?',
 a: 'Your performance stats (goals, assists, matches played) are automatically updated based on match data entered by clubs and tournament organizers.'
 }
 ]
 },
 {
 category: 'For Clubs',
 questions: [
 {
 q: 'What features are included in club membership?',
 a: 'Club membership includes: complete club profile, player management, unlimited digital contracts, tournament participation, analytics dashboard, and priority support.'
 },
 {
 q: 'How do digital contracts work?',
 a: 'Create contract templates, send to players for review, and both parties sign digitally. All contracts are legally binding and stored securely on the platform.'
 },
 {
 q: 'Can I organize my own tournaments?',
 a: 'Yes! Club members can organize friendly matches (both official and hobby level) and manage them on the platform. Additionally, clubs can participate in tournaments organized by PCL. You can set up fixtures, track standings, and manage matches within your club.'
 }
 ]
 },
 {
 category: 'Tournaments',
 questions: [
 {
 q: 'How do I register my club for a tournament?',
 a: 'Browse available tournaments, review requirements, and submit your club\'s registration. Tournament organizers will review and confirm participation.'
 },
 {
 q: 'What tournament formats are supported?',
 a: 'We support various formats including league (round-robin), knockout, and hybrid formats with group stages and playoffs.'
 },
 {
 q: 'How are tournament standings calculated?',
 a: 'Standings are automatically updated based on match results using standard football scoring (3 points for win, 1 for draw, 0 for loss).'
 }
 ]
 },
 {
 category: 'Payments & Billing',
 questions: [
 {
 q: 'What payment methods do you accept?',
 a: 'We accept credit/debit cards, UPI, net banking, and popular digital wallets. All payments are processed securely.'
 },
 {
 q: 'Can I upgrade or downgrade my plan?',
 a: 'Your membership type (Player or Club) is tied to your account role and cannot be changed. If you want to switch roles, you would need to create a separate account with a different email address, as each role has its own membership requirements.'
 },
 {
 q: 'Can I cancel my subscription?',
 a: 'Yes, you can cancel anytime from your account settings. Your subscription remains active until the end of the billing period. Note: Your membership role cannot be changed once selected.'
 },
 {
 q: 'Do you offer refunds?',
 a: 'Refunds are available within 7 days of purchase if you haven\'t used platform features. Since membership is role-based and non-transferable, refunds are only available under exceptional circumstances. See our refund policy for details.'
 }
 ]
 },
 {
 category: 'Technical Support',
 questions: [
 {
 q: 'I forgot my password. How do I reset it?',
 a: 'Click "Forgot Password" on the login page, enter your email, and follow the reset instructions sent to your inbox.'
 },
 {
 q: 'Is my data secure?',
 a: 'Yes! We use industry-standard encryption and security practices. Your data is stored securely and never shared without your permission.'
 },
 {
 q: 'How do I contact support?',
 a: 'Email us at support@professionalclubleague.com or use the contact form. Club members get priority support with faster response times.'
 }
 ]
 }
]

export default function FAQPage() {
 return (
 <div className="min-h-screen bg-background">
 {/* Header */}
 <div className="relative bg-gradient-to-br from-[#1e3a8a]/10 via-[#f97316]/5 to-background border-b border-border overflow-hidden">
 {/* PCL Logo Background */}
 <div className="absolute inset-0 opacity-5">
 <Image
 src="/logo.png"
 alt=""
 fill
 className="object-contain object-center"
 priority
 />
 </div>

 <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
 <div className="text-center">
 {/* PCL Logo */}
 <div className="flex justify-center mb-6">
 <Image
 src="/logo.png"
 alt="PCL Championship"
 width={120}
 height={120}
 className="object-contain"
 priority
 />
 </div>

 <h1 className="text-4xl md:text-6xl font-bold mb-4">
 <span className="text-[#1e3a8a]">Frequently Asked</span>
 <br />
 <span className="text-[#f97316]">Questions</span>
 </h1>
 <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
 Everything you need to know about India's premier digital sports management platform
 </p>

 {/* Search Bar */}
 <div className="max-w-2xl mx-auto relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
 <input
 type="text"
 placeholder="Search for answers... (e.g., 'How do I join a club?')"
 className="w-full pl-12 pr-4 py-4 bg-card/80 backdrop-blur-sm border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-all shadow-lg"
 />
 </div>
 </div>
 </div>
 </div>

 <FAQContent faqs={faqs} />
 </div>
 )
}

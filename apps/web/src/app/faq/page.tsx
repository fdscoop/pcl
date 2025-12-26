import { Metadata } from 'next'
import Link from 'next/link'
import { HelpCircle, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQs | PCL',
  description: 'Frequently asked questions about the Professional Club League',
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
        a: 'Click "Sign Up" in the top navigation, choose your role (player, club owner, referee, etc.), and complete the registration form. Players can sign up for free, while clubs require a subscription plan.'
      },
      {
        q: 'Is PCL free to use?',
        a: 'Yes! Players, referees, and staff can create free accounts. Club owners need a subscription plan (₹4,999/month) to access club management features.'
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
        a: 'Yes! Club members can create and manage tournaments, invite other clubs, set up fixtures, and track standings.'
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
        q: 'Can I cancel my subscription?',
        a: 'Yes, you can cancel anytime from your account settings. Your subscription remains active until the end of the billing period.'
      },
      {
        q: 'Do you offer refunds?',
        a: 'Refunds are available within 7 days of purchase if you haven\'t used premium features. See our refund policy for details.'
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
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to common questions about PCL
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for answers..."
                className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {faqs.map((category, idx) => (
            <div key={idx}>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full" />
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((faq, qIdx) => (
                  <div key={qIdx} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      {faq.q}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-16 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-12 text-center">
          <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:support@professionalclubleague.com"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Email Support
            </a>
            <Link
              href="/guide"
              className="px-6 py-3 bg-card border border-border rounded-lg font-medium hover:bg-accent transition-colors"
            >
              View Getting Started Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

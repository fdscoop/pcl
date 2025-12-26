import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Users, Shield, Trophy, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Getting Started Guide | PCL',
  description: 'Learn how to get started with the Professional Club League platform',
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Getting Started with PCL
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your complete guide to joining and making the most of the Professional Club League
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Start */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Choose Your Path
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="#player-guide" className="bg-card border border-border rounded-xl p-8 hover:border-primary transition-colors group">
              <Users className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-foreground mb-2">I'm a Player</h3>
              <p className="text-muted-foreground">
                Create your profile, join clubs, and start your football journey
              </p>
            </Link>
            
            <Link href="#club-guide" className="bg-card border border-border rounded-xl p-8 hover:border-primary transition-colors group">
              <Shield className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-foreground mb-2">I'm a Club Owner</h3>
              <p className="text-muted-foreground">
                Set up your club, recruit players, and organize tournaments
              </p>
            </Link>
          </div>
        </div>

        {/* Player Guide */}
        <div id="player-guide" className="mb-16 scroll-mt-8">
          <div className="flex items-center gap-4 mb-8">
            <Users className="w-10 h-10 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Player Guide</h2>
          </div>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Create Your Account</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign up with your email and choose "Player" as your role. It's completely free!
                  </p>
                  <Link href="/auth/signup" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                    Sign up now →
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Complete Your Profile</h3>
                  <p className="text-muted-foreground mb-3">
                    Add your details to create a professional player profile:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Personal information and photo
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Playing position and preferred foot
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Experience and career highlights
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Upload profile photo
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Join a Club</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse clubs, apply to join, or wait for clubs to scout and invite you. 
                    Once accepted, you'll sign a digital contract.
                  </p>
                  <Link href="/clubs" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                    Browse clubs →
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Play & Track Stats</h3>
                  <p className="text-muted-foreground">
                    Participate in matches and tournaments. Your performance statistics 
                    (goals, assists, matches played) will be automatically tracked and displayed on your profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Club Guide */}
        <div id="club-guide" className="mb-16 scroll-mt-8">
          <div className="flex items-center gap-4 mb-8">
            <Shield className="w-10 h-10 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Club Owner Guide</h2>
          </div>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Sign Up & Subscribe</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your account and subscribe to the Club plan (₹250/month) to access club management features.
                  </p>
                  <div className="flex gap-3">
                    <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                      Sign up →
                    </Link>
                    <Link href="/pricing" className="text-primary hover:underline font-medium">
                      View pricing →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Create Your Club Profile</h3>
                  <p className="text-muted-foreground mb-3">
                    Complete your club's professional profile:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Club name, logo, and colors
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Location and home stadium
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Club history and achievements
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Contact information
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Recruit Players</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse the player database, scout talent, send invitations, and create digital contracts. 
                    All contracts are legally binding and stored securely.
                  </p>
                  <Link href="/players" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                    Browse players →
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Join Tournaments</h3>
                  <p className="text-muted-foreground mb-4">
                    Register for tournaments, manage your fixtures, and track your club's performance 
                    through comprehensive analytics.
                  </p>
                  <Link href="/tournaments" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                    View tournaments →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-12 text-center">
          <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Need More Help?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Explore our resources or reach out to our support team
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/faq"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
            >
              View FAQs
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 bg-card border border-border rounded-lg font-medium hover:bg-accent"
            >
              View Pricing
            </Link>
            <a
              href="mailto:support@professionalclubleague.com"
              className="px-6 py-3 bg-card border border-border rounded-lg font-medium hover:bg-accent"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

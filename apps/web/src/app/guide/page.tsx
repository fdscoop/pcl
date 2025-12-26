'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Users, Shield, Trophy, CheckCircle, ArrowRight, Mail } from 'lucide-react'
import ContactModal from '@/components/ContactModal'
import BetaNotice from '@/components/BetaNotice'

export default function GuidePage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

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
              <span className="text-[#1e3a8a]">Getting Started</span>
              <br />
              <span className="text-[#f97316]">with PCL</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Your complete guide to joining and making the most of India's premier digital sports management platform
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Beta Notice */}
        <div className="mb-12">
          <BetaNotice size="md" />
        </div>

        {/* Quick Start */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="text-[#1e3a8a]">Choose Your</span>{' '}
            <span className="text-[#f97316]">Path</span>
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
            Select your role to get personalized step-by-step guidance
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Link
              href="#player-guide"
              className="group relative bg-gradient-to-br from-[#1e3a8a]/5 to-[#f97316]/5 border-2 border-border rounded-2xl p-10 hover:border-[#f97316] transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24" />
              </div>
              <Users className="w-16 h-16 text-[#1e3a8a] mb-6 group-hover:scale-110 transition-transform relative z-10" />
              <h3 className="text-3xl font-bold text-[#1e3a8a] mb-3 relative z-10">I'm a Player</h3>
              <p className="text-muted-foreground text-lg mb-4 relative z-10">
                Create your profile, join clubs, and start your football journey with PCL
              </p>
              <div className="flex items-center gap-2 text-[#f97316] font-semibold group-hover:gap-3 transition-all relative z-10">
                Get Started <ArrowRight className="w-5 h-5" />
              </div>
            </Link>

            <Link
              href="#club-guide"
              className="group relative bg-gradient-to-br from-[#f97316]/5 to-[#1e3a8a]/5 border-2 border-border rounded-2xl p-10 hover:border-[#1e3a8a] transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield className="w-24 h-24" />
              </div>
              <Shield className="w-16 h-16 text-[#f97316] mb-6 group-hover:scale-110 transition-transform relative z-10" />
              <h3 className="text-3xl font-bold text-[#f97316] mb-3 relative z-10">I'm a Club Owner</h3>
              <p className="text-muted-foreground text-lg mb-4 relative z-10">
                Set up your club, recruit players, and organize tournaments on PCL
              </p>
              <div className="flex items-center gap-2 text-[#1e3a8a] font-semibold group-hover:gap-3 transition-all relative z-10">
                Get Started <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Player Guide */}
        <div id="player-guide" className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-[#1e3a8a]/10 rounded-xl">
              <Users className="w-10 h-10 text-[#1e3a8a]" />
            </div>
            <h2 className="text-4xl font-bold text-[#1e3a8a]">Player Guide</h2>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="group bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#1e3a8a]/30 transition-all shadow-sm hover:shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1e3a8a] to-[#1e3a8a]/80 text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Create Your Account</h3>
                  <p className="text-muted-foreground text-lg mb-5 leading-relaxed">
                    Sign up with your email and choose "Player" as your role. Get started with your player membership for just ₹75/month!
                  </p>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 text-[#f97316] hover:text-[#ea580c] font-semibold text-lg group-hover:gap-3 transition-all"
                  >
                    Sign up now <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#1e3a8a]/30 transition-all shadow-sm hover:shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1e3a8a] to-[#1e3a8a]/80 text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Complete Your Profile</h3>
                  <p className="text-muted-foreground text-lg mb-5 leading-relaxed">
                    Add your details to create a professional player profile that stands out:
                  </p>
                  <ul className="space-y-3 text-muted-foreground text-base">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#f97316] flex-shrink-0 mt-0.5" />
                      <span>Personal information and professional photo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#f97316] flex-shrink-0 mt-0.5" />
                      <span>Playing position and preferred foot</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#f97316] flex-shrink-0 mt-0.5" />
                      <span>Experience level and career highlights</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#f97316] flex-shrink-0 mt-0.5" />
                      <span>Physical attributes (height, weight, nationality)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#1e3a8a]/30 transition-all shadow-sm hover:shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1e3a8a] to-[#1e3a8a]/80 text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Join a Club</h3>
                  <p className="text-muted-foreground text-lg mb-5 leading-relaxed">
                    Browse clubs, apply to join, or wait for clubs to scout and invite you. Once accepted, you'll sign a secure digital contract through the platform.
                  </p>
                  <Link
                    href="/clubs"
                    className="inline-flex items-center gap-2 text-[#f97316] hover:text-[#ea580c] font-semibold text-lg group-hover:gap-3 transition-all"
                  >
                    Browse clubs <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#1e3a8a]/30 transition-all shadow-sm hover:shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1e3a8a] to-[#1e3a8a]/80 text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Play & Track Stats</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Participate in matches and tournaments. Your performance statistics (goals, assists, matches played) will be automatically tracked and displayed on your professional PCL profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Club Guide */}
        <div id="club-guide" className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-[#f97316]/10 rounded-xl">
              <Shield className="w-10 h-10 text-[#f97316]" />
            </div>
            <h2 className="text-4xl font-bold text-[#f97316]">Club Owner Guide</h2>
          </div>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="group bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#f97316]/30 transition-all shadow-sm hover:shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Sign Up & Subscribe</h3>
                  <p className="text-muted-foreground text-lg mb-5 leading-relaxed">
                    Create your account and subscribe to the Club plan (₹250/month) to access club management features.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center gap-2 text-[#1e3a8a] hover:text-[#1e3a8a]/80 font-semibold text-lg group-hover:gap-3 transition-all"
                    >
                      Sign up <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 text-[#f97316] hover:text-[#ea580c] font-semibold text-lg group-hover:gap-3 transition-all"
                    >
                      View pricing <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#f97316]/30 transition-all shadow-sm hover:shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Create Your Club Profile</h3>
                  <p className="text-muted-foreground text-lg mb-5 leading-relaxed">
                    Complete your club's professional profile on PCL:
                  </p>
                  <ul className="space-y-3 text-muted-foreground text-base">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                      <span>Club name, logo, and team colors</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                      <span>Location and home stadium details</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                      <span>Club history and achievements</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                      <span>Official contact information</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#f97316]/30 transition-all shadow-sm hover:shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Recruit Players</h3>
                  <p className="text-muted-foreground text-lg mb-5 leading-relaxed">
                    Browse the player database, scout talent, send invitations, and create digital contracts. All contracts are legally binding and stored securely on PCL.
                  </p>
                  <Link
                    href="/players"
                    className="inline-flex items-center gap-2 text-[#f97316] hover:text-[#ea580c] font-semibold text-lg group-hover:gap-3 transition-all"
                  >
                    Browse players <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#f97316]/30 transition-all shadow-sm hover:shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">Organize & Participate</h3>
                  <p className="text-muted-foreground text-lg mb-5 leading-relaxed">
                    Organize friendly matches (official or hobby level) for your club and manage them on the platform. Additionally, participate in PCL-organized tournaments to compete with other clubs. Track fixtures, standings, and your club's performance through comprehensive analytics.
                  </p>
                  <Link
                    href="/tournaments"
                    className="inline-flex items-center gap-2 text-[#f97316] hover:text-[#ea580c] font-semibold text-lg group-hover:gap-3 transition-all"
                  >
                    View tournaments <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="relative bg-gradient-to-br from-[#1e3a8a]/10 via-[#f97316]/10 to-background border-2 border-[#1e3a8a]/30 rounded-3xl p-12 text-center overflow-hidden shadow-xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <Image
              src="/logo.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>

          <div className="relative">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-[#1e3a8a]/10 rounded-full">
                <Trophy className="w-12 h-12 text-[#1e3a8a]" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-[#1e3a8a]">Need More</span>{' '}
              <span className="text-[#f97316]">Help?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Explore our comprehensive resources or reach out to our dedicated support team
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
              <Link
                href="/faq"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#1e3a8a] text-white rounded-xl font-semibold hover:bg-[#1e3a8a]/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <BookOpen className="w-5 h-5" />
                View FAQs
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-3 px-8 py-4 bg-card border-2 border-[#f97316]/30 rounded-xl font-semibold hover:bg-[#f97316]/5 hover:border-[#f97316] transition-all"
              >
                <Trophy className="w-5 h-5 text-[#f97316]" />
                View Pricing
              </Link>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-card border-2 border-border rounded-xl font-semibold hover:bg-accent transition-all"
              >
                <Mail className="w-5 h-5" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        defaultSubject="Getting Started with PCL"
      />
    </div>
  )
}

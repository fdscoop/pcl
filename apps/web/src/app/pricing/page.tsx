import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Crown, Shield, ArrowRight, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing & Plans | PCL Championship',
  description: 'Simple, transparent pricing for Professional Club League - Choose the perfect plan for players, clubs, and organizations on India\'s leading sports management platform.',
}

export default function PricingPage() {
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
              <span className="text-[#1e3a8a]">Simple, Transparent</span>
              <br />
              <span className="text-[#f97316]">Pricing</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the perfect plan for your needs on India's premier sports management platform
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Player Plan */}
          <div className="relative bg-gradient-to-br from-[#1e3a8a]/10 via-[#1e3a8a]/5 to-background border-3 border-[#1e3a8a] rounded-3xl p-10 hover:shadow-2xl transition-all hover:scale-105">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#1e3a8a]/80 text-white text-sm font-bold rounded-full shadow-lg">
              MOST POPULAR
            </div>

            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-[#1e3a8a]/10 rounded-2xl">
                  <Users className="w-12 h-12 text-[#1e3a8a]" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-[#1e3a8a] mb-3">Player</h3>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-5xl font-bold text-foreground">₹75</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">Perfect for individual players</p>
            </div>

            <ul className="space-y-4 mb-10">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Complete professional player profile</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Join clubs and tournaments</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Automated statistics tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Digital contract management</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Performance analytics dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Priority support access</span>
              </li>
            </ul>

            <Link
              href="/auth/signup"
              className="group flex items-center justify-center gap-3 w-full px-8 py-4 bg-[#1e3a8a] text-white rounded-xl font-semibold hover:bg-[#1e3a8a]/90 transition-all shadow-lg hover:shadow-xl"
            >
              Start Player Plan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Club Plan */}
          <div className="bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-3xl p-10 hover:shadow-xl transition-all hover:scale-105">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-[#f97316]/10 rounded-2xl">
                  <Shield className="w-12 h-12 text-[#f97316]" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-[#f97316] mb-3">Club</h3>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-5xl font-bold text-foreground">₹250</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">Ideal for club owners</p>
            </div>

            <ul className="space-y-4 mb-10">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#f97316] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">All Player plan features</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#f97316] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Create and manage club profile</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#f97316] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Unlimited player contracts</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#f97316] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Tournament organization</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#f97316] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Advanced analytics dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#f97316] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Complete club management tools</span>
              </li>
            </ul>

            <Link
              href="/auth/signup"
              className="group flex items-center justify-center gap-3 w-full px-8 py-4 bg-card border-2 border-[#f97316] rounded-xl font-semibold hover:bg-[#f97316]/10 transition-all"
            >
              Start Club Plan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-3xl p-10 hover:shadow-xl transition-all hover:scale-105">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-[#1e3a8a]/10 to-[#f97316]/10 rounded-2xl">
                  <Crown className="w-12 h-12 text-[#f97316]" />
                </div>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-[#1e3a8a] to-[#f97316] bg-clip-text text-transparent mb-3">Enterprise</h3>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-5xl font-bold text-foreground">Custom</span>
              </div>
              <p className="text-sm text-muted-foreground">For large organizations</p>
            </div>

            <ul className="space-y-4 mb-10">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Everything in Club plan</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Multiple clubs management</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Custom branding options</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Full API access</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">Dedicated account manager</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                <span className="text-base text-foreground">24/7 priority support</span>
              </li>
            </ul>

            <Link
              href="mailto:sales@professionalclubleague.com"
              className="group flex items-center justify-center gap-3 w-full px-8 py-4 bg-gradient-to-r from-[#1e3a8a] to-[#1e3a8a]/80 text-white rounded-xl font-semibold hover:from-[#1e3a8a]/90 hover:to-[#1e3a8a]/70 transition-all shadow-lg"
            >
              Contact Sales
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="text-[#1e3a8a]">Common</span>{' '}
            <span className="text-[#f97316]">Questions</span>
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
            Everything you need to know about PCL pricing and plans
          </p>

          <div className="space-y-5">
            <div className="bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#1e3a8a]/30 transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">Can I switch plans?</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Yes! You can upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately, and we'll prorate any unused time.
              </p>
            </div>

            <div className="bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#f97316]/30 transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                We accept all major credit/debit cards, UPI, net banking, and popular digital wallets. All payments are processed securely through our payment partners.
              </p>
            </div>

            <div className="bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#1e3a8a]/30 transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">Is there a setup fee?</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                No setup fees or hidden charges! Pay only for your monthly subscription. What you see is what you pay.
              </p>
            </div>

            <div className="bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl p-8 hover:border-[#f97316]/30 transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">Can I cancel my subscription anytime?</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Absolutely! You can cancel your subscription at any time. Your subscription will remain active until the end of your current billing period with full access to all features.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 relative bg-gradient-to-br from-[#1e3a8a]/10 via-[#f97316]/10 to-background border-2 border-[#f97316]/30 rounded-3xl p-12 text-center overflow-hidden shadow-xl">
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-[#1e3a8a]">Ready to Get</span>{' '}
                <span className="text-[#f97316]">Started?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of players and clubs on PCL Championship - India's premier digital sports management platform
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-[#f97316] text-white rounded-xl font-semibold hover:bg-[#ea580c] transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/guide"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-card border-2 border-[#1e3a8a]/30 rounded-xl font-semibold hover:bg-[#1e3a8a]/5 hover:border-[#1e3a8a] transition-all"
                >
                  View Getting Started Guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

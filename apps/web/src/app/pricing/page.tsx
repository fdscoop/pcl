import { Metadata } from 'next'
import Link from 'next/link'
import { Check, Zap, Crown, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing & Plans | PCL',
  description: 'Choose the perfect plan for your club or organization with PCL',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your needs. Start free, upgrade when you're ready.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Player Plan */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary rounded-2xl p-8 relative hover:shadow-xl transition-shadow">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full">
              POPULAR
            </div>
            
            <div className="text-center mb-6">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Player</h3>
              <div className="text-3xl font-bold text-foreground mb-2">₹75</div>
              <p className="text-sm text-muted-foreground">Per month</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Complete player profile</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Join clubs and tournaments</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Track statistics & performance</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Digital contract management</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Performance analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Priority support</span>
              </li>
            </ul>
            
            <Link
              href="/auth/signup"
              className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Start Player Plan
            </Link>
          </div>

          {/* Club Plan */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="text-center mb-6">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Club</h3>
              <div className="text-3xl font-bold text-foreground mb-2">₹250</div>
              <p className="text-sm text-muted-foreground">Per month</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">All Player features</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Create and manage club</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Unlimited player contracts</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Tournament organization</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Advanced analytics dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Club management tools</span>
              </li>
            </ul>
            
            <Link
              href="/auth/signup"
              className="block w-full text-center px-6 py-3 bg-card border-2 border-border rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Start Club Plan
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="text-center mb-6">
              <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
              <div className="text-3xl font-bold text-foreground mb-2">Custom</div>
              <p className="text-sm text-muted-foreground">For organizations</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Everything in Club</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Multiple clubs management</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Custom branding</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">API access</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Dedicated account manager</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">24/7 support</span>
              </li>
            </ul>
            
            <Link
              href="mailto:sales@professionalclubleague.com"
              className="block w-full text-center px-6 py-3 bg-card border-2 border-border rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">Can I switch plans?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit/debit cards, UPI, net banking, and digital wallets.
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">Is there a setup fee?</h3>
              <p className="text-muted-foreground">
                No setup fees! Pay only for your monthly subscription.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

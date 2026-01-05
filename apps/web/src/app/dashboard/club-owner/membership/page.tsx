'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function MembershipPage() {
  const [isTrialActive] = useState(true) // This would come from your database

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Membership Plan</h1>
        <p className="text-gray-600">Manage your club's subscription and billing</p>
      </div>

      {/* Trial Alert */}
      {isTrialActive && (
        <Alert className="mb-6 border-2 border-teal-400 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎉</div>
            <div className="flex-1">
              <h3 className="font-bold text-teal-900 mb-1 text-lg">6-Month Free Trial Active!</h3>
              <p className="text-sm text-teal-800 mb-2">
                You're currently enjoying our 6-month free trial. Full access to all features with no charges until your trial ends.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-teal-900">Trial expires in: 5 months, 12 days</span>
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0 shadow-xl rounded-2xl overflow-hidden text-white mb-6">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="bg-white/20 text-white border-0 mb-3">Current Plan</Badge>
              <h2 className="text-3xl font-bold mb-2">Professional Club Plan</h2>
              <p className="text-lg opacity-90 mb-4">Full access to all platform features</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">₹250</span>
                <span className="text-xl opacity-90">/month + GST</span>
              </div>
              {isTrialActive && (
                <p className="mt-2 text-sm opacity-90">Currently in free trial - no charges yet</p>
              )}
            </div>
            <div className="p-4 bg-white/20 rounded-2xl">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Features */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Plan Features</CardTitle>
            <CardDescription>Everything included in your membership</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Unlimited Player Contracts</h4>
                  <p className="text-sm text-gray-600">Scout and sign unlimited players to your teams</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Multiple Teams Management</h4>
                  <p className="text-sm text-gray-600">Create and manage multiple teams within your club</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Tournament Participation</h4>
                  <p className="text-sm text-gray-600">Register for and compete in local and regional tournaments</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Match Scheduling & Booking</h4>
                  <p className="text-sm text-gray-600">Book venues and schedule matches with other clubs</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Financial Management</h4>
                  <p className="text-sm text-gray-600">Track expenses, player salaries, and budgets</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Player Messaging System</h4>
                  <p className="text-sm text-gray-600">Direct communication with players and scouts</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Analytics & Statistics</h4>
                  <p className="text-sm text-gray-600">Detailed performance metrics and reports</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Priority Support</h4>
                  <p className="text-sm text-gray-600">Get help when you need it from our support team</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <div className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Billing Information</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Rate</p>
                  <p className="text-2xl font-bold text-gray-800">₹250 <span className="text-sm text-gray-600">+ GST</span></p>
                </div>
                <Badge variant="secondary">Per Month</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trial Period</p>
                  <p className="text-2xl font-bold text-gray-800">6 Months</p>
                </div>
                <Badge className="bg-teal-500">Free</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
                  <p className="text-lg font-semibold text-gray-800">June 15, 2026</p>
                </div>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 3 0 003-3V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">Payment Method</h4>
                <Button variant="outline" className="w-full" disabled>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Add Payment Method (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Have questions about your membership or billing? Our support team is here to help.
              </p>
              <Button variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

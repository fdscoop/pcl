'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TournamentsPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Tournaments</h1>
        <p className="text-gray-600">Browse and participate in competitive tournaments</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Tournament System</CardTitle>
          <CardDescription>Compete in local and regional tournaments</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center py-12">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Coming Soon</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Tournament functionality is currently under development. Soon you'll be able to browse tournaments,
              register your teams, and track your progress through competitions.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" disabled>
                Browse Tournaments
              </Button>
              <Button variant="outline" disabled>
                My Registrations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Types Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-800">Local Tournaments</CardTitle>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-800">City Championships</p>
                  <p className="text-sm text-gray-600">Compete with clubs in your area</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-800">Weekly Leagues</p>
                  <p className="text-sm text-gray-600">Regular season competitions</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-800">Community Cups</p>
                  <p className="text-sm text-gray-600">Friendly local competitions</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-800">Regional Tournaments</CardTitle>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-800">State Championships</p>
                  <p className="text-sm text-gray-600">Compete at the state level</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-800">Inter-State Cups</p>
                  <p className="text-sm text-gray-600">Multi-state competitions</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-800">National Qualifiers</p>
                  <p className="text-sm text-gray-600">Path to national tournaments</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg rounded-2xl overflow-hidden text-white">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold mb-1">0</div>
            <p className="text-sm opacity-90">Active Tournaments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg rounded-2xl overflow-hidden text-white">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold mb-1">0</div>
            <p className="text-sm opacity-90">Registrations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-lg rounded-2xl overflow-hidden text-white">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold mb-1">0</div>
            <p className="text-sm opacity-90">Matches Played</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-lg rounded-2xl overflow-hidden text-white">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold mb-1">0</div>
            <p className="text-sm opacity-90">Trophies Won</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Club {
  id: number
  name: string
  mp: number  // Matches Played
  w: number   // Wins
  d: number   // Draws
  l: number   // Losses
  gf: number  // Goals For
  ga: number  // Goals Against
  gd: number  // Goal Difference
  pts: number // Points
}

interface PlayerHighlight {
  name: string
  club: string
  stat: string
  label: string
  type: 'player' | 'scorer' | 'assists' | 'saves'
  imageUrl?: string
}

const mockClubs: Club[] = [
  { id: 1, name: 'Leeuwarden FC', mp: 6, w: 4, d: 1, l: 1, gf: 14, ga: 8, gd: 6, pts: 13 },
  { id: 2, name: 'Frisian United', mp: 6, w: 4, d: 0, l: 2, gf: 12, ga: 7, gd: 5, pts: 12 },
  { id: 3, name: 'Canal City', mp: 6, w: 3, d: 1, l: 2, gf: 9, ga: 8, gd: 1, pts: 10 },
  { id: 4, name: 'Delta Blues', mp: 6, w: 2, d: 1, l: 3, gf: 7, ga: 10, gd: -3, pts: 7 },
]

const mockHighlights: PlayerHighlight[] = [
  {
    name: 'R. Nair',
    club: 'Leeuwarden FC',
    stat: '8.3 avg rating',
    label: 'Top Player',
    type: 'player',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=600&fit=crop'
  },
  {
    name: 'A. Verbeek',
    club: 'Frisian United',
    stat: '6 goals',
    label: 'Top Scorer',
    type: 'scorer',
    imageUrl: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400&h=600&fit=crop'
  },
  {
    name: 'M. Johnson',
    club: 'Canal City',
    stat: '5 assists',
    label: 'Top Assists',
    type: 'assists',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=600&fit=crop'
  },
  {
    name: 'K. Singh',
    club: 'Delta Blues',
    stat: '12 saves',
    label: 'Top Keeper',
    type: 'saves',
    imageUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&h=600&fit=crop'
  },
]

export default function TournamentStatistics() {
  const [activeTab, setActiveTab] = useState('friendly')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('all')
  const [selectedState, setSelectedState] = useState('all')

  // Define available districts and states
  const districts = [
    { id: 'all', name: 'All Districts' },
    { id: 'kasaragod', name: 'Kasaragod (Pilot)' },
    { id: 'kannur', name: 'Kannur' },
    { id: 'kozhikode', name: 'Kozhikode' },
    { id: 'malappuram', name: 'Malappuram' },
    { id: 'palakkad', name: 'Palakkad' },
    { id: 'thrissur', name: 'Thrissur' },
    { id: 'ernakulam', name: 'Ernakulam' },
    { id: 'kottayam', name: 'Kottayam' },
    { id: 'alappuzha', name: 'Alappuzha' },
    { id: 'kollam', name: 'Kollam' },
    { id: 'thiruvananthapuram', name: 'Thiruvananthapuram' },
  ]

  const states = [
    { id: 'all', name: 'All States' },
    { id: 'kerala', name: 'Kerala' },
    { id: 'karnataka', name: 'Karnataka' },
    { id: 'tamil-nadu', name: 'Tamil Nadu' },
  ]

  const filteredClubs = mockClubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: 'friendly', label: 'Friendly', filterType: 'district', description: 'Casual matches', available: true },
    { id: 'tournaments', label: 'Tournaments', filterType: 'district', description: 'Competitive tournaments', available: true },
    { id: 'dql', label: 'DQL', filterType: 'district', description: 'District Qualifier Level', available: false },
    { id: 'amateur', label: 'Amateur League', filterType: 'district', description: 'District Level Amateur Competition', available: false },
    { id: 'intermediate', label: 'Intermediate League', filterType: 'state', description: 'State Level Competition', available: false },
    { id: 'professional', label: 'Professional League', filterType: 'national', description: 'National Level Championship', available: false },
  ]

  // Get current tab info
  const currentTab = tabs.find(tab => tab.id === activeTab)

  // Determine which filter to show based on active tab
  const showDistrictFilter = currentTab?.filterType === 'district'
  const showStateFilter = currentTab?.filterType === 'state' || currentTab?.filterType === 'region'
  const showNoFilter = currentTab?.filterType === 'national'

  const getHighlightGradient = (type: string) => {
    switch (type) {
      case 'player':
        return 'from-blue-500 to-purple-600'
      case 'scorer':
        return 'from-orange-500 to-pink-600'
      case 'assists':
        return 'from-green-500 to-teal-600'
      case 'saves':
        return 'from-indigo-500 to-blue-600'
      default:
        return 'from-blue-500 to-purple-600'
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👑</span>
          <h2 className="text-3xl font-bold text-slate-900">Tournament Statistics</h2>
        </div>
        <div className="text-sm text-slate-600">
          from Friendly → Professional
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium whitespace-nowrap transition-all relative ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tier-Specific Alerts - Only show for unavailable tiers */}
      {!currentTab?.available && activeTab === 'dql' && (
        <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-3xl mt-0.5">🏆</span>
            <div>
              <h4 className="font-bold text-amber-900 mb-2 text-lg">District Qualifier League (DQL) - Coming Soon!</h4>
              <p className="text-sm text-amber-800 mb-3">
                The District Qualifier League will be the entry point for clubs to compete at the district level.
                Top 4 teams from each district will advance to the Amateur League.
              </p>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="px-3 py-1.5 bg-white/80 text-amber-900 rounded-lg font-semibold border border-amber-200">📍 District Level Competition</span>
                <span className="px-3 py-1.5 bg-white/80 text-amber-900 rounded-lg font-semibold border border-amber-200">🎯 Top 4 Advance</span>
                <span className="px-3 py-1.5 bg-white/80 text-amber-900 rounded-lg font-semibold border border-amber-200">⚽ Multiple Formats Available</span>
              </div>
              <p className="text-xs text-amber-700 italic">
                This tier is currently under development. Join Friendly Matches or Tournaments to build your team's profile!
              </p>
            </div>
          </div>
        </div>
      )}

      {!currentTab?.available && activeTab === 'amateur' && (
        <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-3xl mt-0.5">🥉</span>
            <div>
              <h4 className="font-bold text-green-900 mb-2 text-lg">Amateur League - Coming Soon!</h4>
              <p className="text-sm text-green-800 mb-3">
                The Amateur League is a district-level amateur competition for qualified teams.
                This tier requires AIFF approval and is being developed with your collective efforts.
              </p>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="px-3 py-1.5 bg-white/80 text-green-900 rounded-lg font-semibold border border-green-200">📍 District Level Competition</span>
                <span className="px-3 py-1.5 bg-white/80 text-green-900 rounded-lg font-semibold border border-green-200">🏛️ AIFF Approval Required</span>
                <span className="px-3 py-1.5 bg-white/80 text-green-900 rounded-lg font-semibold border border-green-200">⚽ Amateur Teams</span>
              </div>
              <p className="text-xs text-green-700 italic">
                This tier requires AIFF recognition and approval. Join Friendly Matches to build your team while we work together on obtaining official sanction!
              </p>
            </div>
          </div>
        </div>
      )}

      {!currentTab?.available && activeTab === 'intermediate' && (
        <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-300 rounded-lg shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-3xl mt-0.5">🥈</span>
            <div>
              <h4 className="font-bold text-purple-900 mb-2 text-lg">Intermediate League - Coming Soon!</h4>
              <p className="text-sm text-purple-800 mb-3">
                The Intermediate League is a state-level championship for elite teams.
                This tier requires AIFF approval and is being developed through our collective efforts with time.
              </p>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="px-3 py-1.5 bg-white/80 text-purple-900 rounded-lg font-semibold border border-purple-200">🏛️ State Level Championship</span>
                <span className="px-3 py-1.5 bg-white/80 text-purple-900 rounded-lg font-semibold border border-purple-200">🏛️ AIFF Approval Required</span>
                <span className="px-3 py-1.5 bg-white/80 text-purple-900 rounded-lg font-semibold border border-purple-200">⭐ Professional Standards</span>
              </div>
              <p className="text-xs text-purple-700 italic">
                This state-level tier requires AIFF recognition. Build your reputation in current tournaments while we work together to make this a reality!
              </p>
            </div>
          </div>
        </div>
      )}

      {!currentTab?.available && activeTab === 'professional' && (
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-3xl mt-0.5">🥇</span>
            <div>
              <h4 className="font-bold text-blue-900 mb-2 text-lg">Professional League - Coming Soon!</h4>
              <p className="text-sm text-blue-800 mb-3">
                The Professional League is the national-level championship - India's premier club football competition.
                This tier requires AIFF approval and will be achieved through our collective efforts and dedication.
              </p>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="px-3 py-1.5 bg-white/80 text-blue-900 rounded-lg font-semibold border border-blue-200">🇮🇳 National Championship</span>
                <span className="px-3 py-1.5 bg-white/80 text-blue-900 rounded-lg font-semibold border border-blue-200">🏛️ AIFF Approval Required</span>
                <span className="px-3 py-1.5 bg-white/80 text-blue-900 rounded-lg font-semibold border border-blue-200">⭐ Professional Standards</span>
              </div>
              <p className="text-xs text-blue-700 italic">
                This is the pinnacle of club football in India. Requires AIFF recognition - together we will make this a reality! Start your journey with Friendly Matches today.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Highlights */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🏆</span>
          <h3 className="text-2xl font-bold text-slate-900">Key Highlights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockHighlights.map((highlight, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-3xl shadow-2xl aspect-[4/5] group cursor-pointer transform transition-transform hover:scale-105"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                {highlight.imageUrl ? (
                  <img
                    src={highlight.imageUrl}
                    alt={highlight.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${getHighlightGradient(highlight.type)}`} />
                )}
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getHighlightGradient(
                  highlight.type
                )} opacity-60 mix-blend-multiply`} />
                {/* Dark gradient from bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>

              {/* Number Badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">{index + 7}</span>
                </div>
              </div>

              {/* Curved accent line */}
              <div className="absolute right-0 top-1/4 w-1/2 h-1/2 opacity-30 z-10">
                <svg viewBox="0 0 100 200" className="w-full h-full">
                  <path
                    d="M0 0 Q 50 100 0 200"
                    fill="none"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="10"
                  />
                </svg>
              </div>

              {/* Info Section - Lower Half */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                {/* Badge */}
                <div className="inline-block bg-orange-500 px-4 py-1.5 rounded-full text-xs font-bold mb-3 shadow-lg">
                  {highlight.label.toUpperCase()}
                </div>

                {/* Player Info */}
                <div className="text-white">
                  <h4 className="text-2xl font-bold mb-1 drop-shadow-lg">
                    {highlight.name}
                  </h4>
                  <p className="text-sm text-white/90 mb-3 drop-shadow">
                    {highlight.club}
                  </p>

                  {/* Stats Box */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                    <div className="text-3xl font-bold text-orange-300 mb-0.5">
                      {highlight.stat}
                    </div>
                    <div className="text-xs text-white/80 font-medium">
                      {highlight.label}
                    </div>
                  </div>
                </div>
              </div>

              {/* Large watermark text */}
              <div className="absolute bottom-16 left-0 right-0 pointer-events-none overflow-hidden z-10">
                <div
                  className="text-[80px] font-black text-white/10 leading-none"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  PCL
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Club Standings */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col gap-4">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Club Standings</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      {currentTab?.label || activeTab}
                    </span>
                    {currentTab?.description && (
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        {currentTab.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Input
                    type="text"
                    placeholder="Search club..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    🔍
                  </span>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <span>📊</span>
                  <span className="hidden sm:inline">Pts</span>
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* District Filter */}
              {showDistrictFilter && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">📍 District:</span>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* State Filter */}
              {showStateFilter && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">🏛️ State:</span>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* National Level Info */}
              {showNoFilter && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-blue-700">🇮🇳 National Level</span>
                  <span className="text-xs text-blue-600">All India Championship</span>
                </div>
              )}

              {/* Info Badge based on filter type */}
              {showDistrictFilter && selectedDistrict === 'kasaragod' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-200">
                  <span className="text-xs font-semibold text-green-700">🎯 Pilot District</span>
                </div>
              )}

              {showDistrictFilter && selectedDistrict !== 'kasaragod' && selectedDistrict !== 'all' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-200">
                  <span className="text-xs font-semibold text-amber-700">⚽ Friendly Matches Only</span>
                </div>
              )}

              {/* Promotion Info */}
              {activeTab === 'tournaments' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-200">
                  <span className="text-xs font-semibold text-indigo-700">🎖️ Competitive tournaments</span>
                </div>
              )}
              {activeTab === 'dql' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-xs font-semibold text-green-700">🏆 Top 4 teams → Amateur League</span>
                </div>
              )}
              {activeTab === 'amateur' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-xs font-semibold text-blue-700">🏆 Top 2 teams → Intermediate League</span>
                </div>
              )}
              {activeTab === 'intermediate' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="text-xs font-semibold text-purple-700">🏆 Top teams → Professional League</span>
                </div>
              )}
            </div>

            {/* Promotion Pathway Visualization */}
            {activeTab !== 'friendly' && activeTab !== 'tournaments' && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Promotion Path:</span>
                  <div className="flex items-center gap-1">
                    <span className={activeTab === 'dql' ? 'font-bold text-blue-600' : ''}>DQL</span>
                    <span>→</span>
                    <span className={activeTab === 'amateur' ? 'font-bold text-blue-600' : ''}>Amateur</span>
                    <span>→</span>
                    <span className={activeTab === 'intermediate' ? 'font-bold text-blue-600' : ''}>Intermediate</span>
                    <span>→</span>
                    <span className={activeTab === 'professional' ? 'font-bold text-blue-600' : ''}>Professional</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Club
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  MP
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  W
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  D
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  L
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  GF
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  GA
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  GD
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClubs.length > 0 ? (
                filteredClubs.map((club, index) => {
                  // Determine if team is in promotion zone
                  const isPromotionZone =
                    (activeTab === 'dql' && index < 4) ||
                    (activeTab === 'amateur' && index < 2) ||
                    (activeTab === 'intermediate' && index < 4)

                  return (
                    <tr
                      key={club.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isPromotionZone ? 'bg-green-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <span className={isPromotionZone ? 'text-green-700 font-bold' : 'text-slate-500'}>
                            {index + 1}
                          </span>
                          {isPromotionZone && (
                            <span className="text-green-600 text-xs">↑</span>
                          )}
                        </div>
                      </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {club.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">
                      {club.mp}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">
                      {club.w}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">
                      {club.d}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">
                      {club.l}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">
                      {club.gf}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">
                      {club.ga}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-medium text-center ${
                        club.gd > 0
                          ? 'text-green-600'
                          : club.gd < 0
                          ? 'text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {club.gd > 0 ? '+' : ''}
                      {club.gd}
                    </td>
                      <td className="px-6 py-4 text-sm font-bold text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={isPromotionZone ? 'text-green-700' : 'text-blue-600'}>
                            {club.pts}
                          </span>
                          {isPromotionZone && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-600 text-white rounded font-semibold">
                              Q
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-slate-500 text-sm"
                  >
                    No clubs found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredClubs.length === 0 && searchQuery === '' && (
          <div className="px-6 py-8 text-center text-slate-500 text-sm">
            No matches for this level.
          </div>
        )}

        {/* Legend for Promotion Zones */}
        {activeTab !== 'friendly' && activeTab !== 'tournaments' && activeTab !== 'professional' && filteredClubs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-6 text-xs">
              <span className="font-semibold text-slate-700">Legend:</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-50 border border-green-200 rounded"></span>
                <span className="text-slate-600">
                  Promotion Zone
                  {activeTab === 'dql' && ' (Top 4)'}
                  {activeTab === 'amateur' && ' (Top 2)'}
                  {activeTab === 'intermediate' && ' (Top 4)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">↑</span>
                <span className="text-slate-600">Qualifies for next level</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 bg-green-600 text-white rounded font-semibold">Q</span>
                <span className="text-slate-600">Qualified</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

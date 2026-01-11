'use client'

import { ReactNode } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DayPicker } from 'react-day-picker'
import {
  MobileStepWizard,
  MobileSelectionCard,
  MobileSectionHeader,
  MobileInfoBanner,
  MobileSummaryRow,
  MobileWizardStep
} from '@/components/ui/mobile-step-wizard'
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Search,
  CheckCircle2,
  Building,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Lock,
  Banknote,
  Info,
  Calculator
} from 'lucide-react'

// Types from the main component
interface Club {
  id: string
  name: string
  city: string
  state: string
  district: string
  kyc_verified: boolean
  logo_url?: string
  available_formats?: {
    '5-a-side': boolean
    '7-a-side': boolean
    '11-a-side': boolean
  }
  squad_sizes?: {
    '5-a-side': number
    '7-a-side': number
    '11-a-side': number
  }
}

interface Stadium {
  id: string
  stadium_name: string
  location: string
  district: string | null
  city?: string
  state?: string
  hourly_rate: number
  facilities?: string[]
  amenities?: string[]
  is_active: boolean
  photos?: string[]
}

interface Referee {
  id: string
  unique_referee_id: string
  certification_level: string
  hourly_rate: number
  is_available: boolean
  users: {
    first_name: string
    last_name: string
  }
}

interface Staff {
  id: string
  unique_staff_id: string
  role_type: string
  hourly_rate: number
  is_available: boolean
  users: {
    first_name: string
    last_name: string
  }
}

interface MobileMatchCreationProps {
  // Form state
  formData: {
    matchFormat: string
    teamId: string
    selectedClub: Club | null
    matchDate: Date
    matchTime: string
    duration: number
    stadiumId: string
    selectedStadium: Stadium | null
    matchType: 'friendly' | 'official'
    leagueType: string | null
    refereeIds: string[]
    staffIds: string[]
    prizeMoney: number
    hasPrizeMoney: boolean
    notes: string
    teamSize: number
  }
  setFormData: (updater: (prev: any) => any) => void

  // Available data
  availableFormats: string[]
  teams: any[]
  filteredClubs: Club[]
  filteredStadiums: Stadium[]
  availableReferees: Referee[]
  availableStaff: Staff[]

  // Calendar state
  selectedDate: Date | undefined
  setSelectedDate: (date: Date | undefined) => void
  blockedTimeSlots: string[]
  availableTimeSlots: string[]
  isLoadingMatches: boolean

  // Budget
  budget: {
    stadiumCost: number
    refereeCost: number
    staffCost: number
    processingFee: number
    totalCost: number
    costPerPlayer: number
  }

  // Payment state
  paymentProcessing: boolean
  paymentCompleted: boolean

  // Actions
  selectClub: (club: Club) => void
  selectStadium: (stadium: Stadium) => void
  toggleReferee: (id: string) => void
  toggleStaff: (id: string) => void
  canSelectTimeSlot: (time: string) => boolean
  handlePayment: () => void

  // Navigation
  currentStep: number
  setCurrentStep: (step: number) => void
  validateStep1: () => boolean
  validateStep2: () => boolean
  validateStep3: () => boolean
  validateStep4: () => boolean
  validateStep5: () => boolean

  // Search
  clubSearchTerm: string
  setClubSearchTerm: (term: string) => void

  // Club info
  club: any

  // Photo navigation
  selectedStadiumPhotos: { [key: string]: number }
  nextStadiumPhoto: (stadiumId: string, totalPhotos: number, e: React.MouseEvent) => void
  prevStadiumPhoto: (stadiumId: string, totalPhotos: number, e: React.MouseEvent) => void
  
  // Close handler
  onClose?: () => void
}

export function MobileMatchCreation({
  formData,
  setFormData,
  availableFormats,
  teams,
  filteredClubs,
  filteredStadiums,
  availableReferees,
  availableStaff,
  selectedDate,
  setSelectedDate,
  blockedTimeSlots,
  availableTimeSlots,
  isLoadingMatches,
  budget,
  paymentProcessing,
  paymentCompleted,
  selectClub,
  selectStadium,
  toggleReferee,
  toggleStaff,
  canSelectTimeSlot,
  handlePayment,
  currentStep,
  setCurrentStep,
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  clubSearchTerm,
  setClubSearchTerm,
  club,
  selectedStadiumPhotos,
  nextStadiumPhoto,
  prevStadiumPhoto,
  onClose
}: MobileMatchCreationProps) {

  // Format icon helper
  const getFormatIcon = (format: string) => {
    switch (format) {
      case '5-a-side': return '⚡'
      case '7-a-side': return '🎯'
      case '11-a-side': return '🏆'
      default: return '⚽'
    }
  }

  // Step 1: Match Setup Content
  const Step1Content = () => (
    <div className="mobile-wizard-content">
      {/* Match Format Section */}
      <div className="mobile-wizard-section">
        <MobileSectionHeader
          title="Match Format"
          icon="⚽"
          subtitle="Choose your game type"
        />
        <div className="space-y-3">
          {availableFormats.map((format) => (
            <MobileSelectionCard
              key={format}
              selected={formData.matchFormat === format}
              onClick={() => setFormData((prev: any) => ({ ...prev, matchFormat: format }))}
              icon={<span className="text-2xl">{getFormatIcon(format)}</span>}
              title={format}
              subtitle={
                format === '5-a-side' ? '8 players • 1 hour' :
                format === '7-a-side' ? '11 players • 2 hours' :
                '14 players • 3 hours'
              }
            />
          ))}
        </div>
      </div>

      {/* Team Selection */}
      <div className="mobile-wizard-section">
        <MobileSectionHeader
          title="Your Team"
          icon="👥"
        />
        <select
          className="w-full p-4 border-2 border-gray-200 rounded-xl text-base bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all touch-manipulation"
          value={formData.teamId}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, teamId: e.target.value }))}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.team_name} ({team.total_players || 0} players)
            </option>
          ))}
        </select>
      </div>

      {/* Opponent Selection */}
      <div className="mobile-wizard-section">
        <MobileSectionHeader
          title="Opponent Club"
          icon="🆚"
          subtitle={club.district ? `${club.district} District` : club.city}
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search clubs..."
            value={clubSearchTerm}
            onChange={(e) => setClubSearchTerm(e.target.value)}
            className="pl-12 py-4 text-base rounded-xl border-2 touch-manipulation"
          />
        </div>

        {/* Selected Club Display */}
        {formData.selectedClub && (
          <MobileInfoBanner
            variant="success"
            icon="✓"
            title={formData.selectedClub.name}
            description={`${formData.selectedClub.city}, ${formData.selectedClub.district}`}
          />
        )}

        {/* Club List */}
        <div className="mobile-wizard-list space-y-3">
          {filteredClubs.map((clubItem) => {
            const canPlayFormat = clubItem.available_formats?.[formData.matchFormat as keyof typeof clubItem.available_formats]
            const squadSize = clubItem.squad_sizes?.[formData.matchFormat as keyof typeof clubItem.squad_sizes] || 0

            return (
              <MobileSelectionCard
                key={clubItem.id}
                selected={formData.selectedClub?.id === clubItem.id}
                onClick={() => canPlayFormat && selectClub(clubItem)}
                disabled={!canPlayFormat}
                title={clubItem.name}
                subtitle={`${clubItem.city}, ${clubItem.district}`}
                badge={clubItem.kyc_verified ? 'Verified' : undefined}
              >
                <div className="flex flex-wrap gap-1 mt-2">
                  {clubItem.available_formats?.['5-a-side'] && (
                    <Badge className="bg-orange-100 text-orange-700 text-xs">5s</Badge>
                  )}
                  {clubItem.available_formats?.['7-a-side'] && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">7s</Badge>
                  )}
                  {clubItem.available_formats?.['11-a-side'] && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">11s</Badge>
                  )}
                </div>
              </MobileSelectionCard>
            )
          })}
        </div>
      </div>

      {/* Match Type */}
      <div className="mobile-wizard-section">
        <MobileSectionHeader
          title="Match Type"
          icon="🎮"
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData((prev: any) => ({ ...prev, matchType: 'friendly', leagueType: 'hobby' }))}
            className={`p-4 rounded-xl border-2 text-center transition-all touch-manipulation ${
              formData.matchType === 'friendly'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200'
            }`}
          >
            <div className="text-2xl mb-1">🏃</div>
            <div className="font-semibold text-sm">Friendly</div>
            <div className="text-xs text-gray-500">No officials</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev: any) => ({ ...prev, matchType: 'official', leagueType: 'friendly' }))}
            className={`p-4 rounded-xl border-2 text-center transition-all touch-manipulation ${
              formData.matchType === 'official'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <div className="text-2xl mb-1">🏆</div>
            <div className="font-semibold text-sm">Official</div>
            <div className="text-xs text-gray-500">With officials</div>
          </button>
        </div>
      </div>
    </div>
  )

  // Step 2: Stadium Selection Content
  const Step2Content = () => (
    <div className="mobile-wizard-content">
      <MobileSectionHeader
        title="Select Stadium"
        icon="🏟️"
        subtitle={`${filteredStadiums.length} available`}
      />

      {/* Selected Stadium Summary */}
      {formData.selectedStadium && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            {formData.selectedStadium.photos && formData.selectedStadium.photos.length > 0 ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={formData.selectedStadium.photos[0]}
                  alt={formData.selectedStadium.stadium_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-purple-200 flex items-center justify-center flex-shrink-0">
                <Building className="h-8 w-8 text-purple-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-purple-900 truncate">{formData.selectedStadium.stadium_name}</span>
              </div>
              <p className="text-sm text-purple-700 truncate">{formData.selectedStadium.location}</p>
              <Badge className="mt-1 bg-purple-600 text-white">₹{formData.selectedStadium.hourly_rate}/hr</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Stadium List */}
      <div className="space-y-3">
        {filteredStadiums.map((stadium) => (
          <button
            key={stadium.id}
            type="button"
            onClick={() => selectStadium(stadium)}
            className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all active:scale-[0.98] ${
              formData.stadiumId === stadium.id
                ? 'border-purple-500 shadow-lg'
                : 'border-gray-200'
            }`}
          >
            {/* Stadium Photo */}
            <div className="relative h-32 bg-gray-100">
              {stadium.photos && stadium.photos.length > 0 ? (
                <>
                  <img
                    src={stadium.photos[selectedStadiumPhotos[stadium.id] || 0]}
                    alt={stadium.stadium_name}
                    className="w-full h-full object-cover"
                  />
                  {stadium.photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          prevStadiumPhoto(stadium.id, stadium.photos!.length, e)
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          nextStadiumPhoto(stadium.id, stadium.photos!.length, e)
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {stadium.photos.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${
                              idx === (selectedStadiumPhotos[stadium.id] || 0)
                                ? 'bg-white'
                                : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building className="h-12 w-12 text-gray-400" />
                </div>
              )}
              {formData.stadiumId === stadium.id && (
                <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Stadium Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{stadium.stadium_name}</h4>
                  <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {stadium.location}
                  </p>
                </div>
                <Badge className="bg-green-600 text-white ml-2 flex-shrink-0">
                  ₹{stadium.hourly_rate}/hr
                </Badge>
              </div>
              {stadium.facilities && stadium.facilities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {stadium.facilities.slice(0, 3).map((facility, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {facility}
                    </Badge>
                  ))}
                  {stadium.facilities.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{stadium.facilities.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // Step 3: Date & Time Selection Content
  const Step3Content = () => {
    const [showDatePicker, setShowDatePicker] = React.useState(false)

    const timeSlots = {
      morning: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'],
      afternoon: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      evening: ['18:00', '19:00', '20:00', '21:00']
    }

    const renderTimeSlot = (time: string) => {
      const isBlocked = blockedTimeSlots.includes(time)
      const isSelected = formData.matchTime === time
      const isAvailable = availableTimeSlots.includes(time)
      const canSelect = canSelectTimeSlot(time)

      return (
        <button
          key={time}
          type="button"
          disabled={isBlocked || !isAvailable || !canSelect}
          onClick={() => setFormData((prev: any) => ({ ...prev, matchTime: time }))}
          className={`
            py-3 px-2 rounded-xl text-sm font-medium transition-all
            ${isSelected
              ? 'bg-blue-600 text-white shadow-lg'
              : isBlocked
                ? 'bg-red-100 text-red-400 cursor-not-allowed'
                : !canSelect
                  ? 'bg-orange-50 text-orange-400 cursor-not-allowed'
                  : isAvailable
                    ? 'bg-green-50 text-green-700 border border-green-200 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {time}
        </button>
      )
    }

    return (
      <div className="space-y-6">
        {!formData.stadiumId ? (
          <MobileInfoBanner
            variant="warning"
            icon="⚠️"
            title="Stadium Required"
            description="Please go back and select a stadium first."
          />
        ) : (
          <>
            {/* Date Selection */}
            <div>
              <MobileSectionHeader
                title="Select Date"
                icon="📅"
              />
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-left flex items-center gap-3 active:border-blue-500"
              >
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Pick a date'}
                </span>
              </button>

              {showDatePicker && (
                <div className="mt-2 bg-white border-2 border-gray-200 rounded-xl p-4 shadow-lg">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date)
                      setFormData((prev: any) => ({ ...prev, matchDate: date || new Date() }))
                      setShowDatePicker(false)
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="!font-medium mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <MobileSectionHeader
                  title="Select Time"
                  icon="🕐"
                />

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-400 rounded"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                </div>

                {isLoadingMatches ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading availability...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Morning */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        Morning (6AM - 12PM)
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.morning.map(renderTimeSlot)}
                      </div>
                    </div>

                    {/* Afternoon */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        Afternoon (12PM - 6PM)
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.afternoon.map(renderTimeSlot)}
                      </div>
                    </div>

                    {/* Evening */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                        Evening (6PM - 10PM)
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.evening.map(renderTimeSlot)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Time Summary */}
                {formData.matchTime && (
                  <div className="mt-4">
                    <MobileInfoBanner
                      variant="success"
                      icon="✓"
                      title={`${format(selectedDate, 'MMM d')} at ${formData.matchTime}`}
                      description={`Duration: ${formData.duration} hour${formData.duration > 1 ? 's' : ''}`}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Step 4: Officials Selection Content
  const Step4Content = () => (
    <div className="space-y-6">
      {formData.matchType === 'official' ? (
        <>
          {/* Referees */}
          <div>
            <MobileSectionHeader
              title={`Referees (${formData.refereeIds.length} selected)`}
              icon="👨‍⚖️"
            />
            <div className="space-y-3">
              {availableReferees.length === 0 ? (
                <MobileInfoBanner
                  variant="info"
                  icon="ℹ️"
                  title="No Referees Available"
                  description="No referees are currently available in your area."
                />
              ) : (
                availableReferees.map((referee) => (
                  <MobileSelectionCard
                    key={referee.id}
                    selected={formData.refereeIds.includes(referee.id)}
                    onClick={() => toggleReferee(referee.id)}
                    title={`${referee.users.first_name} ${referee.users.last_name}`}
                    subtitle={`${referee.certification_level} • ${referee.unique_referee_id}`}
                    badge={`₹${referee.hourly_rate}/hr`}
                  />
                ))
              )}
            </div>
          </div>

          {/* Staff */}
          <div>
            <MobileSectionHeader
              title={`PCL Staff (${formData.staffIds.length} selected)`}
              icon="👷"
            />
            <div className="space-y-3">
              {availableStaff.length === 0 ? (
                <MobileInfoBanner
                  variant="info"
                  icon="ℹ️"
                  title="No Staff Available"
                  description="No PCL staff are currently available in your area."
                />
              ) : (
                availableStaff.map((staff) => (
                  <MobileSelectionCard
                    key={staff.id}
                    selected={formData.staffIds.includes(staff.id)}
                    onClick={() => toggleStaff(staff.id)}
                    title={`${staff.users.first_name} ${staff.users.last_name}`}
                    subtitle={`${staff.role_type} • ${staff.unique_staff_id}`}
                    badge={`₹${staff.hourly_rate}/hr`}
                  />
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg text-gray-900 mb-2">No Officials Required</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Friendly/Hobby matches don't require referees or PCL staff. You can proceed to review.
          </p>
        </div>
      )}
    </div>
  )

  // Step 5: Review Content
  const Step5Content = () => (
    <div className="space-y-6">
      {/* Match Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Match Summary
        </h3>
        <div className="space-y-0">
          <MobileSummaryRow label="Format" value={formData.matchFormat} onEdit={() => setCurrentStep(1)} />
          <MobileSummaryRow label="Type" value={formData.matchType} />
          <MobileSummaryRow
            label="Your Team"
            value={teams.find(t => t.id === formData.teamId)?.team_name || 'Not selected'}
          />
          <MobileSummaryRow
            label="Opponent"
            value={formData.selectedClub?.name || 'Not selected'}
            onEdit={() => setCurrentStep(1)}
          />
          <MobileSummaryRow
            label="Stadium"
            value={formData.selectedStadium?.stadium_name || 'Not selected'}
            onEdit={() => setCurrentStep(2)}
          />
          <MobileSummaryRow
            label="Date & Time"
            value={selectedDate ? `${format(selectedDate, 'MMM d')} @ ${formData.matchTime}` : 'Not selected'}
            onEdit={() => setCurrentStep(3)}
          />
          <MobileSummaryRow label="Duration" value={`${formData.duration} hour${formData.duration > 1 ? 's' : ''}`} />
          {formData.matchType === 'official' && (
            <MobileSummaryRow
              label="Officials"
              value={`${formData.refereeIds.length} Ref, ${formData.staffIds.length} Staff`}
              onEdit={() => setCurrentStep(4)}
            />
          )}
        </div>
      </div>

      {/* Budget Calculator */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Budget Breakdown
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Stadium ({formData.duration}h)</span>
            <span className="font-medium">₹{budget.stadiumCost}</span>
          </div>
          {formData.matchType === 'official' && budget.refereeCost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Referees ({formData.refereeIds.length})</span>
              <span className="font-medium">₹{budget.refereeCost}</span>
            </div>
          )}
          {formData.matchType === 'official' && budget.staffCost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">PCL Staff ({formData.staffIds.length})</span>
              <span className="font-medium">₹{budget.staffCost}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Platform (9.5%)</span>
            <span className="font-medium">₹{budget.processingFee.toFixed(2)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-green-600">₹{budget.totalCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Cost per player */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-xs text-blue-600 mb-1">Cost Per Player</p>
          <p className="text-xl font-bold text-blue-700">₹{budget.costPerPlayer.toFixed(2)}</p>
          <p className="text-xs text-blue-500">Split between {formData.teamSize * 2} players</p>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
          placeholder="Any special requirements..."
          className="mt-2 rounded-xl"
          rows={2}
        />
      </div>
    </div>
  )

  // Step 6: Payment Content
  const Step6Content = () => (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
        <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Stadium ({formData.duration}h)</span>
            <span>₹{budget.stadiumCost}</span>
          </div>
          {budget.refereeCost > 0 && (
            <div className="flex justify-between">
              <span>Referees</span>
              <span>₹{budget.refereeCost}</span>
            </div>
          )}
          {budget.staffCost > 0 && (
            <div className="flex justify-between">
              <span>PCL Staff</span>
              <span>₹{budget.staffCost}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Platform Charges</span>
            <span>₹{budget.processingFee.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-green-600">₹{budget.totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Match Quick Info */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-gray-500 text-xs">Format</span>
            <p className="font-medium">{formData.matchFormat}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Date</span>
            <p className="font-medium">{selectedDate ? format(selectedDate, 'MMM d, yyyy') : '-'}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Time</span>
            <p className="font-medium">{formData.matchTime}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Stadium</span>
            <p className="font-medium truncate">{formData.selectedStadium?.stadium_name}</p>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      {!paymentCompleted && !paymentProcessing && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Secure Payment</h4>
              <p className="text-blue-700 text-sm">
                Your payment is protected by Razorpay with industry-standard encryption.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs">256-bit SSL</Badge>
                <Badge variant="outline" className="text-xs">PCI Compliant</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentProcessing && (
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
            <div>
              <h4 className="font-semibold text-yellow-900">Processing Payment...</h4>
              <p className="text-yellow-700 text-sm">Please don't close this page.</p>
            </div>
          </div>
        </div>
      )}

      {paymentCompleted && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900">Payment Successful!</h4>
              <p className="text-green-700 text-sm">Your match is being created...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Build the steps array
  const steps: MobileWizardStep[] = [
    {
      id: 1,
      title: 'Match Setup',
      shortTitle: 'Setup',
      icon: '⚙️',
      content: <Step1Content />,
      isValid: validateStep1()
    },
    {
      id: 2,
      title: 'Select Stadium',
      shortTitle: 'Stadium',
      icon: '🏟️',
      content: <Step2Content />,
      isValid: validateStep2()
    },
    {
      id: 3,
      title: 'Date & Time',
      shortTitle: 'Schedule',
      icon: '📅',
      content: <Step3Content />,
      isValid: validateStep3()
    },
    {
      id: 4,
      title: 'Officials',
      shortTitle: 'Officials',
      icon: '👨‍⚖️',
      content: <Step4Content />,
      isValid: validateStep4()
    },
    {
      id: 5,
      title: 'Review',
      shortTitle: 'Review',
      icon: '📋',
      content: <Step5Content />,
      isValid: validateStep5()
    },
    {
      id: 6,
      title: 'Payment',
      shortTitle: 'Pay',
      icon: '💳',
      content: <Step6Content />,
      isValid: paymentCompleted
    }
  ]

  // Final step payment button
  const finalStepButton = (
    <Button
      type="button"
      onClick={handlePayment}
      disabled={paymentProcessing || paymentCompleted || budget.totalCost <= 0}
      className={`
        w-full py-4 text-base font-semibold rounded-xl transition-all
        ${!paymentProcessing && !paymentCompleted
          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg active:scale-[0.98]'
          : paymentCompleted
            ? 'bg-green-500 text-white'
            : 'bg-gray-300 text-gray-500'
        }
      `}
    >
      {paymentProcessing ? (
        <span className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Processing...
        </span>
      ) : paymentCompleted ? (
        <span className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Payment Complete
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pay ₹{budget.totalCost.toFixed(2)}
          <Lock className="h-4 w-4" />
        </span>
      )}
    </Button>
  )

  return (
    <MobileStepWizard
      steps={steps}
      currentStep={currentStep}
      onNextStep={() => setCurrentStep(Math.min(currentStep + 1, 6))}
      onPreviousStep={() => setCurrentStep(Math.max(currentStep - 1, 1))}
      onStepClick={(step) => {
        if (step <= currentStep) {
          setCurrentStep(step)
        }
      }}
      isLoading={isLoadingMatches && currentStep === 2}
      loadingText="Loading availability..."
      isFinalStep={currentStep === 6}
      finalStepButton={finalStepButton}
      title="Create Match"
      useDynamicTitle={true}
      hideNavbar={true}
      onClose={onClose}
    />
  )
}

// Need to import React for the useState in Step3Content
import React from 'react'

export default MobileMatchCreation

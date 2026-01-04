'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/context/ToastContext'

interface ElaboratedContractModalProps {
  player: {
    id: string
    unique_player_id: string
    state?: string | null
    district?: string | null
    address?: string | null
    users?: {
      first_name: string
      last_name: string
      email?: string
    }
  } | null
  club: {
    id: string
    name: string
    logo_url?: string
    state?: string
    city?: string
    country?: string
    type?: string
    category?: string
    email?: string
    phone?: string
  } | null
  onClose: () => void
  onSubmit?: (contractData: any) => Promise<void>
}

export default function ElaboratedContractModal({
  player,
  club,
  onClose,
  onSubmit
}: ElaboratedContractModalProps) {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    contractType: '',
    annualSalary: '',
    releaseClause: '',
    signingBonus: '',
    goalBonus: '',
    appearanceBonus: '',
    medicalInsurance: '',
    housingAllowance: '',
    position: '',
    jerseyNumber: '',
    trainingDaysPerWeek: '',
    imageRights: 'yes',
    noticePeriod: '',
    agentName: '',
    agentContact: '',
    termsAndConditions: '',
    clubSignatoryName: '',
    clubSignatoryDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'form' | 'policies'>('form')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  if (!player) {
    return null
  }

  // Prepare club display info
  const clubName = club?.name || 'Your Club'
  const clubId = club?.id || 'Loading...'
  const clubLocation = club?.city && club?.state ? `${club.city}, ${club.state}, ${club.country || 'India'}` : 'Not provided'
  const clubContact = club?.email && club?.phone ? `${club.email} • ${club.phone}` : 'Not provided'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }))
    }
  }

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
  }

  // Validation helper
  const isFieldInvalid = (fieldName: string, value: string) => {
    return touched[fieldName] && !value
  }

  const getInputClassName = (fieldName: string, value: string, isRequired: boolean = false) => {
    const baseClass = "border-slate-300"
    if (isRequired && isFieldInvalid(fieldName, value)) {
      return "border-red-500 focus:border-red-500 focus:ring-red-500"
    }
    return baseClass
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    // Mark all required fields as touched to show validation
    setTouched({
      startDate: true,
      endDate: true,
      annualSalary: true,
      contractType: true,
      clubSignatoryName: true,
      clubSignatoryDate: true
    })

    try {
      // Check basic contract fields
      if (!formData.contractType || !formData.startDate || !formData.endDate || !formData.annualSalary) {
        setError('Please fill in all required fields (Contract Type, Start Date, End Date, Annual Salary)')
        addToast({
          type: 'error',
          title: 'Missing Required Fields',
          description: 'Please fill in all required fields marked with *'
        })
        setLoading(false)
        return
      }

      // Check club signatory fields
      if (!formData.clubSignatoryName || !formData.clubSignatoryName.trim()) {
        setError('Club Authorized Signatory: PRINTED NAME & TITLE is required')
        addToast({
          type: 'error',
          title: 'Missing Signatory Information',
          description: 'Please provide the club authorized signatory name and title'
        })
        setLoading(false)
        return
      }

      if (!formData.clubSignatoryDate) {
        setError('Club Authorized Signatory: DATE is required')
        addToast({
          type: 'error',
          title: 'Missing Signatory Date',
          description: 'Please provide the date for club authorization'
        })
        setLoading(false)
        return
      }

      // Validate date fields
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const signatureDate = new Date(formData.clubSignatoryDate)
      signatureDate.setHours(0, 0, 0, 0)

      if (start >= end) {
        setError('End date must be after start date')
        addToast({
          type: 'error',
          title: 'Invalid Date Range',
          description: 'End date must be after start date'
        })
        setLoading(false)
        return
      }

      // Validate signatory date is not in the future (allow today's date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (signatureDate > today) {
        setError('Club signatory date cannot be in the future')
        addToast({
          type: 'error',
          title: 'Invalid Signature Date',
          description: 'Signature date cannot be in the future'
        })
        setLoading(false)
        return
      }

      await onSubmit?.({
        ...formData,
        playerId: player?.id,
        clubId: club?.id
      })

      const playerUser = player?.users
      addToast({
        type: 'success',
        title: 'Contract Created',
        description: `Contract issued to ${playerUser?.first_name} ${playerUser?.last_name}`
      })

      setTimeout(() => {
        setFormData({
          startDate: '',
          endDate: '',
          contractType: '',
          annualSalary: '',
          releaseClause: '',
          signingBonus: '',
          goalBonus: '',
          appearanceBonus: '',
          medicalInsurance: '',
          housingAllowance: '',
          position: '',
          jerseyNumber: '',
          trainingDaysPerWeek: '',
          imageRights: 'yes',
          noticePeriod: '',
          agentName: '',
          agentContact: '',
          termsAndConditions: '',
          clubSignatoryName: '',
          clubSignatoryDate: ''
        })
        onClose()
      }, 1500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create contract'
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Contract Creation Failed',
        description: errorMsg
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto pt-20">
      <Card className="w-full max-w-5xl shadow-2xl my-8 flex-shrink-0">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">Professional Player Contract</CardTitle>
              <p className="text-blue-100 mt-2 text-sm">Professional Club League (PCL)</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={onClose}
              className="text-white hover:bg-blue-500"
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Tabs Navigation */}
          <div className="flex gap-2 border-b-2">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-3 px-4 rounded-t-lg font-semibold transition-all ${
                activeTab === 'form'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              📝 Contract Form
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`flex-1 py-3 px-4 rounded-t-lg font-semibold transition-all ${
                activeTab === 'policies'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              📋 PCL Policies
            </button>
          </div>

          {/* CONTRACT FORM TAB */}
          {activeTab === 'form' && (
            <div className="space-y-8 pt-4">
              {/* Club Information Section */}
              <div className="border-2 border-blue-300 rounded-lg p-6 bg-blue-50">
                <h3 className="text-xl font-bold text-blue-900 mb-4">🏢 Club Information (Employer)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">CLUB NAME</p>
                    <p className="text-lg font-bold text-slate-900">{clubName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">CLUB ID</p>
                    <p className="text-sm font-mono text-slate-700">{clubId}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-600 font-semibold">LOCATION</p>
                    <p className="text-sm text-slate-700">📍 {clubLocation}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-600 font-semibold">CONTACT</p>
                    <p className="text-sm text-slate-700">📧 {clubContact}</p>
                  </div>
                </div>
              </div>

              {/* Player Information Section */}
              <div className="border-2 border-green-300 rounded-lg p-6 bg-green-50">
                <h3 className="text-xl font-bold text-green-900 mb-4">⚽ Player Information (Employee)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">PLAYER NAME</p>
                    <p className="text-lg font-bold text-slate-900">
                      {player.users?.first_name} {player.users?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">PLAYER ID</p>
                    <p className="text-sm font-mono text-slate-700">{player.unique_player_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">EMAIL</p>
                    <p className="text-sm text-slate-700">{player.users?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">STATE</p>
                    <p className="text-sm text-slate-700">{player.state || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">DISTRICT</p>
                    <p className="text-sm text-slate-700">{player.district || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">ADDRESS</p>
                    <p className="text-sm text-slate-700">{player.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Contract Details Form */}
              <div className="border-2 border-slate-300 rounded-lg p-6 bg-slate-50 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">CONTRACT TERMS TO BE FILLED</h3>
                  <p className="text-xs text-slate-600 mt-2">
                    <span className="text-red-500">*</span> indicates required field
                  </p>
                </div>

                {/* Employment Period */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    📅 Employment Period
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        CONTRACT TYPE <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="contractType"
                        value={formData.contractType}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('contractType')}
                        required
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${getInputClassName('contractType', formData.contractType, true)}`}
                      >
                        <option value="">Select contract type</option>
                        <option value="permanent">Permanent</option>
                        <option value="loan">Loan</option>
                        <option value="trial">Trial Period</option>
                        <option value="seasonal">Seasonal</option>
                      </select>
                      {isFieldInvalid('contractType', formData.contractType) && (
                        <p className="text-xs text-red-500 mt-1">Contract type is required</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        NOTICE PERIOD (Days)
                      </label>
                      <Input
                        type="number"
                        name="noticePeriod"
                        value={formData.noticePeriod}
                        onChange={handleInputChange}
                        placeholder="e.g., 30"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        CONTRACT START DATE <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('startDate')}
                        required
                        className={getInputClassName('startDate', formData.startDate, true)}
                      />
                      {isFieldInvalid('startDate', formData.startDate) && (
                        <p className="text-xs text-red-500 mt-1">Start date is required</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        CONTRACT END DATE <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('endDate')}
                        required
                        className={getInputClassName('endDate', formData.endDate, true)}
                      />
                      {isFieldInvalid('endDate', formData.endDate) && (
                        <p className="text-xs text-red-500 mt-1">End date is required</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Terms */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    💰 Financial Terms
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        ANNUAL SALARY (₹) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        name="annualSalary"
                        value={formData.annualSalary}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('annualSalary')}
                        placeholder="0.00"
                        required
                        className={getInputClassName('annualSalary', formData.annualSalary, true)}
                      />
                      {isFieldInvalid('annualSalary', formData.annualSalary) && (
                        <p className="text-xs text-red-500 mt-1">Annual salary is required</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        SIGNING BONUS (₹)
                      </label>
                      <Input
                        type="number"
                        name="signingBonus"
                        value={formData.signingBonus}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        RELEASE CLAUSE (₹)
                      </label>
                      <Input
                        type="number"
                        name="releaseClause"
                        value={formData.releaseClause}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        GOAL BONUS (₹ per goal)
                      </label>
                      <Input
                        type="number"
                        name="goalBonus"
                        value={formData.goalBonus}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        APPEARANCE BONUS (₹ per match)
                      </label>
                      <Input
                        type="number"
                        name="appearanceBonus"
                        value={formData.appearanceBonus}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Player Contract Details */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    🏆 Player Contract Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        POSITION
                      </label>
                      <Input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        placeholder="e.g., Forward, Defender, Goalkeeper"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        JERSEY NUMBER
                      </label>
                      <Input
                        type="number"
                        name="jerseyNumber"
                        value={formData.jerseyNumber}
                        onChange={handleInputChange}
                        placeholder="e.g., 10"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        TRAINING DAYS PER WEEK
                      </label>
                      <Input
                        type="number"
                        name="trainingDaysPerWeek"
                        value={formData.trainingDaysPerWeek}
                        onChange={handleInputChange}
                        placeholder="e.g., 5"
                        min="1"
                        max="7"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        IMAGE RIGHTS
                      </label>
                      <select
                        name="imageRights"
                        value={formData.imageRights}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="yes">Club can use player image</option>
                        <option value="limited">Limited use with approval</option>
                        <option value="no">No image rights granted</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Benefits & Allowances */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    🏥 Benefits & Allowances
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        MEDICAL INSURANCE (₹ per year)
                      </label>
                      <Input
                        type="number"
                        name="medicalInsurance"
                        value={formData.medicalInsurance}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        HOUSING ALLOWANCE (₹ per month)
                      </label>
                      <Input
                        type="number"
                        name="housingAllowance"
                        value={formData.housingAllowance}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Agent Details */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    👤 Player Agent/Representative (Optional)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        AGENT NAME
                      </label>
                      <Input
                        type="text"
                        name="agentName"
                        value={formData.agentName}
                        onChange={handleInputChange}
                        placeholder="Leave blank if no agent"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        AGENT CONTACT
                      </label>
                      <Input
                        type="text"
                        name="agentContact"
                        value={formData.agentContact}
                        onChange={handleInputChange}
                        placeholder="Phone/Email"
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Terms & Conditions */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-600 block mb-2">
                    ADDITIONAL TERMS & CONDITIONS
                  </label>
                  <textarea
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                    placeholder="Enter any additional terms, conditions, special clauses, bonuses, incentives, performance metrics, etc..."
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
                  />
                </div>
              </div>

              {/* Signature Areas - AT THE BOTTOM OF FORM */}
              <div className="border-2 border-purple-300 rounded-lg p-6 bg-purple-50">
                <h3 className="text-xl font-bold text-purple-900 mb-6">✍️ SIGNATURES & AUTHORIZATION</h3>

                <div className="grid grid-cols-2 gap-8">
                  {/* Club Signature */}
                  <div className="border-2 border-blue-200 rounded-lg p-6 bg-white">
                    <h4 className="font-bold text-blue-900 mb-4">Club Authorized Signatory <span className="text-red-500">*</span></h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-600 font-semibold mb-2">SIGNATURE</p>
                        <div className="h-20 border-2 border-dashed border-blue-300 rounded flex items-center justify-center text-slate-400 bg-blue-50">
                          [Signature Space]
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Club representative must provide hand signature</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          PRINTED NAME & TITLE <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="clubSignatoryName"
                          value={formData.clubSignatoryName}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('clubSignatoryName')}
                          placeholder="Name and official title"
                          className={`w-full px-2 py-1 text-xs border rounded transition-colors ${
                            touched.clubSignatoryName && !formData.clubSignatoryName.trim()
                              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-300'
                              : 'border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200'
                          }`}
                        />
                        {touched.clubSignatoryName && !formData.clubSignatoryName.trim() && (
                          <p className="text-xs text-red-600 mt-1">⚠️ Club signatory name and title is required</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          DATE <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="clubSignatoryDate"
                          value={formData.clubSignatoryDate}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('clubSignatoryDate')}
                          className={`w-full px-2 py-1 text-xs border rounded transition-colors ${
                            touched.clubSignatoryDate && !formData.clubSignatoryDate
                              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-300'
                              : 'border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200'
                          }`}
                        />
                        {touched.clubSignatoryDate && !formData.clubSignatoryDate && (
                          <p className="text-xs text-red-600 mt-1">⚠️ Signature date is required</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Player Signature */}
                  <div className="border-2 border-green-200 rounded-lg p-6 bg-white">
                    <h4 className="font-bold text-green-900 mb-4">Player Signature & Acceptance</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-600 font-semibold mb-2">SIGNATURE</p>
                        <div className="h-20 border-2 border-dashed border-green-300 rounded flex items-center justify-center text-slate-400 bg-green-50">
                          [Signature Space]
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          PRINTED NAME
                        </label>
                        <input
                          type="text"
                          placeholder="Full name"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          DATE
                        </label>
                        <input
                          type="date"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 border-t-2 pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2"
                >
                  {loading ? '⏳ Creating Contract...' : '✓ Create & Issue Contract'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 font-bold py-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* PCL POLICIES TAB */}
          {activeTab === 'policies' && (
            <div className="space-y-6 pt-4">
              <h3 className="text-2xl font-bold text-slate-900">PCL STANDARD POLICIES & REGULATIONS</h3>
              <p className="text-slate-700">All players and clubs must comply with the following PCL policies:</p>

              <div className="space-y-4">
                <PolicyCard
                  number="1"
                  title="No Dual Membership"
                  description="Players cannot be registered with more than one club simultaneously during a season. A player must complete all contractual obligations with the current club before joining another club."
                />
                <PolicyCard
                  number="2"
                  title="Tournament Participation Mandatory"
                  description="All registered players must participate in PCL-organized tournaments as per the league schedule. Unauthorized absence may result in suspension and disciplinary action."
                />
                <PolicyCard
                  number="3"
                  title="Code of Conduct & Sportsmanship"
                  description="Players must adhere to the PCL Code of Conduct both on and off the field, including respect for officials, opponents, and spectators. Violations may result in fines, suspension, or contract termination."
                />
                <PolicyCard
                  number="4"
                  title="Transfer Window Compliance"
                  description="All player transfers and contracts must be registered within designated transfer windows as per PCL regulations. Mid-season transfers follow specific rules and approval requirements."
                />
                <PolicyCard
                  number="5"
                  title="Contract Compliance & Enforcement"
                  description="Both club and player must comply with all terms outlined in this contract. Breach may result in sanctions, fines, suspension, or legal action as per PCL regulations and applicable laws."
                />
                <PolicyCard
                  number="6"
                  title="Anti-Doping & Medical Standards"
                  description="All players must comply with PCL anti-doping policies and undergo required medical tests. Failure to comply or positive test results will result in immediate suspension."
                />
                <PolicyCard
                  number="7"
                  title="Financial Compliance"
                  description="Clubs must pay contracted salaries on time. Failure to pay may result in deduction of league points, fines, or contract resolution at player's benefit."
                />
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mt-6">
                <p className="text-sm text-yellow-900 font-semibold">
                  ⚠️ By signing this contract, both club and player acknowledge that they have read, understood, and agree to comply with all PCL Standard Policies and Regulations.
                </p>
              </div>

              {/* Back Button */}
              <div className="flex gap-3 border-t-2 pt-6">
                <Button
                  onClick={() => setActiveTab('form')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2"
                >
                  ← Back to Contract Form
                </Button>
              </div>
            </div>
          )}

          {/* PCL Watermark Footer */}
          <div className="text-center pt-4 border-t text-xs text-slate-500">
            <p>This contract is issued under the authority of Professional Club League (PCL)</p>
            <p>All disputes shall be resolved as per PCL Regulations and applicable laws</p>
            <p className="text-[10px] mt-2 text-slate-400">Contract ID will be generated upon submission</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PolicyCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="border-l-4 border-blue-600 bg-blue-50 p-4 rounded-r-lg">
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {number}
        </div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">{title}</h4>
          <p className="text-slate-700 text-sm mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}

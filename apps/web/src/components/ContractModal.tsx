'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ContractModalProps {
  player: {
    id: string
    unique_player_id: string
    users?: {
      first_name: string
      last_name: string
    }
  } | null
  club: {
    id: string
    name: string
    logo_url?: string
  } | null
  onClose: () => void
  onSubmit?: (contractData: any) => Promise<void>
}

export default function ContractModal({
  player,
  club,
  onClose,
  onSubmit
}: ContractModalProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    annualSalary: '',
    releaseClause: '',
    position: '',
    jerseyNumber: '',
    termsAndConditions: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.startDate || !formData.endDate || !formData.annualSalary) {
        setError('Please fill in all required fields (Start Date, End Date, Annual Salary)')
        setLoading(false)
        return
      }

      // Validate date range
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      
      if (start >= end) {
        setError('End date must be after start date')
        setLoading(false)
        return
      }

      await onSubmit?.({
        ...formData,
        playerId: player?.id,
        clubId: club?.id
      })

      setSuccess(true)
      setTimeout(() => {
        setFormData({
          startDate: '',
          endDate: '',
          annualSalary: '',
          releaseClause: '',
          position: '',
          jerseyNumber: '',
          termsAndConditions: ''
        })
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract')
    } finally {
      setLoading(false)
    }
  }

  if (!player || !club) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create Player Contract</CardTitle>
          <CardDescription>
            Contract between {club.name} and {player.users?.first_name} {player.users?.last_name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                ✓ Contract created successfully! Player will receive it in their contract page.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Player & Club Info */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Contract Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Player Info */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Player</label>
                <p className="text-sm font-semibold text-slate-900">
                  {player.users?.first_name} {player.users?.last_name}
                </p>
                <p className="text-xs text-slate-600">{player.unique_player_id}</p>
              </div>

              {/* Club Info */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Club</label>
                <p className="text-sm font-semibold text-slate-900">{club.name}</p>
                <p className="text-xs text-slate-600">Club ID: {club.id}</p>
              </div>
            </div>
          </div>

          {/* Contract Dates */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Contract Period</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Financial Terms */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Financial Terms</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Annual Salary (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="annualSalary"
                  placeholder="e.g., 500000"
                  value={formData.annualSalary}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Release Clause (₹)
                </label>
                <Input
                  type="number"
                  name="releaseClause"
                  placeholder="e.g., 1000000"
                  value={formData.releaseClause}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Player Details */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Player Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                <Input
                  type="text"
                  name="position"
                  placeholder="e.g., Forward, Midfielder"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Jersey Number</label>
                <Input
                  type="number"
                  name="jerseyNumber"
                  placeholder="e.g., 7"
                  value={formData.jerseyNumber}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Terms & Conditions</h3>
            <textarea
              name="termsAndConditions"
              placeholder="Enter any additional terms, conditions, or special clauses..."
              value={formData.termsAndConditions}
              onChange={handleInputChange}
              className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-600 mt-2">
              Standard PCL policies will be automatically included (No dual club membership, PCL tournament participation required, etc.)
            </p>
          </div>

          {/* Standard Policies Notice */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">PCL Standard Policies</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Player can only play for one club at a time</li>
              <li>✓ Player must participate in PCL tournaments represented by this club</li>
              <li>✓ Club is responsible for player conduct and disciplinary actions</li>
              <li>✓ No anti-theft or illegal transfer clauses</li>
              <li>✓ All contracts are binding under PCL regulations</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating Contract...' : 'Create & Send Contract'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  User,
  Bell,
  Lock,
  Globe,
  Save,
  Camera
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface UserSettings {
  first_name: string
  last_name: string
  email: string
  phone: string
  bio: string
  profile_photo_url: string
}

interface NotificationSettings {
  emailNotifications: boolean
  bookingAlerts: boolean
  payoutNotifications: boolean
  marketingEmails: boolean
}

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useState<UserSettings>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    profile_photo_url: ''
  })
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    bookingAlerts: true,
    payoutNotifications: true,
    marketingEmails: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setUserSettings({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          bio: data.bio || '',
          profile_photo_url: data.profile_photo_url || ''
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load settings',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('users')
        .update({
          first_name: userSettings.first_name,
          last_name: userSettings.last_name,
          phone: userSettings.phone,
          bio: userSettings.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      addToast({
        title: 'Success',
        description: 'Profile updated successfully',
        type: 'success'
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update profile',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))

    addToast({
      title: 'Settings Updated',
      description: 'Notification preferences have been saved',
      type: 'success'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-3 border-orange-200 dark:border-orange-900"></div>
            <div className="w-12 h-12 rounded-full border-3 border-orange-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
              <User className="h-5 w-5 text-white" />
            </div>
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs sm:text-sm">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-4 py-3.5">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40">
              <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            Profile Information
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 px-4 pb-4">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Profile Photo */}
            <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="relative">
                {userSettings.profile_photo_url ? (
                  <img
                    src={userSettings.profile_photo_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-orange-200 dark:ring-orange-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center ring-2 ring-orange-200 dark:ring-orange-800">
                    <User className="h-8 w-8 text-white" />
                  </div>
                )}
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full text-white hover:shadow-lg transition-all"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Profile Photo</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  JPG, PNG or GIF (max. 2MB)
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium text-slate-600 dark:text-slate-300">First Name</Label>
                <Input
                  id="firstName"
                  value={userSettings.first_name}
                  onChange={(e) =>
                    setUserSettings({ ...userSettings, first_name: e.target.value })
                  }
                  className="border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-orange-500/20 text-sm h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-slate-600 dark:text-slate-300">Last Name</Label>
                <Input
                  id="lastName"
                  value={userSettings.last_name}
                  onChange={(e) =>
                    setUserSettings({ ...userSettings, last_name: e.target.value })
                  }
                  className="border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-orange-500/20 text-sm h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-slate-600 dark:text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userSettings.email}
                  disabled
                  className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm h-9"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Contact support to change your email
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-slate-600 dark:text-slate-300">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userSettings.phone}
                  onChange={(e) =>
                    setUserSettings({ ...userSettings, phone: e.target.value })
                  }
                  className="border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-orange-500/20 text-sm h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-medium text-slate-600 dark:text-slate-300">Bio</Label>
              <Textarea
                id="bio"
                value={userSettings.bio}
                onChange={(e) =>
                  setUserSettings({ ...userSettings, bio: e.target.value })
                }
                placeholder="Tell us about yourself and your stadiums..."
                rows={3}
                className="border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-orange-500/20 text-sm resize-none"
              />
            </div>

            <Button 
              type="submit" 
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 text-sm h-9"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3.5">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-4 pb-4 space-y-2.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Email Notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={() => handleNotificationChange('emailNotifications')}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Booking Alerts</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Get notified when someone books your stadium
              </p>
            </div>
            <Switch
              checked={notifications.bookingAlerts}
              onCheckedChange={() => handleNotificationChange('bookingAlerts')}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Payout Notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updates about your payouts and earnings
              </p>
            </div>
            <Switch
              checked={notifications.payoutNotifications}
              onCheckedChange={() => handleNotificationChange('payoutNotifications')}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Marketing Emails</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive updates about new features and promotions
              </p>
            </div>
            <Switch
              checked={notifications.marketingEmails}
              onCheckedChange={() => handleNotificationChange('marketingEmails')}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 px-4 py-3.5">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Security
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-4 pb-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Password</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Last changed 30 days ago
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8 border-slate-200 dark:border-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all">
              Change Password
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Two-Factor Authentication</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add an extra layer of security
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8 border-slate-200 dark:border-slate-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-3.5">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40">
              <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            Preferences
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-4 pb-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Language</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose your preferred language
              </p>
            </div>
            <select className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20 transition-colors">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Timezone</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set your local timezone
              </p>
            </div>
            <select className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20 transition-colors">
              <option>UTC+5:30 (India Standard Time)</option>
              <option>UTC-5 (Eastern Time)</option>
              <option>UTC-6 (Central Time)</option>
              <option>UTC-8 (Pacific Time)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 hover:shadow-lg transition-all overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-red-500 to-rose-500"></div>
        <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 px-4 py-3.5">
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-sm sm:text-base">
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/40">
              <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            Danger Zone
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Irreversible actions - proceed with caution
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-4 pb-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-red-200 dark:border-red-900 rounded-xl bg-red-50/50 dark:bg-red-900/10">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Deactivate Account</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Temporarily disable your account
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8 text-red-600 border-red-300 dark:border-red-800 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
              Deactivate
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-red-200 dark:border-red-900 rounded-xl bg-red-50/50 dark:bg-red-900/10">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Delete Account</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm" className="text-xs h-8 shadow-md hover:shadow-lg transition-all">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

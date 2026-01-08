# 🚀 REFEREE & STAFF DASHBOARDS - CODE TEMPLATES

## ✅ SQL MIGRATIONS APPLIED

Great! Now let's create the frontend pages.

---

## 📁 FILE STRUCTURE TO CREATE

```
apps/web/src/app/dashboard/
├── referee/
│   ├── layout.tsx          ← REPLACE
│   ├── page.tsx            ← REPLACE  
│   ├── profile/
│   │   └── page.tsx        ← CREATE
│   ├── kyc/
│   │   └── page.tsx        ← CREATE (clone from stadium)
│   ├── certifications/
│   │   └── page.tsx        ← CREATE
│   ├── invitations/
│   │   └── page.tsx        ← CREATE
│   ├── matches/
│   │   ├── page.tsx        ← CREATE
│   │   └── [id]/
│   │       └── page.tsx    ← CREATE
│   ├── availability/
│   │   └── page.tsx        ← CREATE
│   └── payouts/
│       └── page.tsx        ← CREATE (clone from stadium)
│
└── staff/
    ├── layout.tsx          ← REPLACE
    ├── page.tsx            ← REPLACE
    ├── profile/page.tsx    ← CREATE
    ├── kyc/page.tsx        ← CREATE
    ├── certifications/page.tsx  ← CREATE
    ├── invitations/page.tsx     ← CREATE
    ├── matches/
    │   ├── page.tsx        ← CREATE
    │   └── [id]/page.tsx   ← CREATE
    ├── availability/page.tsx    ← CREATE
    └── payouts/page.tsx    ← CREATE
```

---

## 🎯 STRATEGY: CLONE & ADAPT

Since you already have a working **Stadium Owner KYC system**, we'll:

1. **Clone** the stadium KYC page → Modify for referee/staff
2. **Clone** the stadium payouts page → Modify for referee/staff
3. **Clone** the stadium documents component → Modify for certifications
4. **Create new** pages for match invitations, availability, etc.

---

## 📄 CODE TEMPLATES

### File 1: `apps/web/src/app/dashboard/referee/profile/page.tsx`

```tsx
'use client'

import { use Effect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/context/ToastContext'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function RefereeProfile() {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [referee, setReferee] = useState<any>(null)
  const [formData, setFormData] = useState({
    bio: '',
    city: '',
    state: '',
    district: '',
    experience_years: 0,
    hourly_rate: '',
    certification_level: '',
    federation: '',
    license_number: '',
    license_expiry_date: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: refereeData } = await supabase
        .from('referees')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (refereeData) {
        setReferee(refereeData)
        setFormData({
          bio: refereeData.bio || '',
          city: refereeData.city || '',
          state: refereeData.state || '',
          district: refereeData.district || '',
          experience_years: refereeData.experience_years || 0,
          hourly_rate: refereeData.hourly_rate || '',
          certification_level: refereeData.certification_level || '',
          federation: refereeData.federation || '',
          license_number: refereeData.license_number || '',
          license_expiry_date: refereeData.license_expiry_date || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (referee) {
        // Update existing
        const { error } = await supabase
          .from('referees')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', referee.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('referees')
          .insert({
            user_id: user!.id,
            unique_referee_id: `REF-${Date.now()}`,
            ...formData
          })

        if (error) throw error
      }

      addToast('Profile saved successfully!', 'success')
      router.push('/dashboard/referee')
    } catch (error: any) {
      addToast(error.message || 'Failed to save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/referee">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Referee Profile</h1>
          <p className="text-gray-600">Manage your professional information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your referee profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your refereeing experience..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="experience_years">Experience (Years)</Label>
              <Input
                id="experience_years"
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
              <Input
                id="hourly_rate"
                type="number"
                placeholder="500"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="federation">Federation</Label>
              <Input
                id="federation"
                placeholder="e.g., AIFF, State FA"
                value={formData.federation}
                onChange={(e) => setFormData({ ...formData, federation: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="license_expiry_date">License Expiry Date</Label>
              <Input
                id="license_expiry_date"
                type="date"
                value={formData.license_expiry_date}
                onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
            <Link href="/dashboard/referee">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 📋 NEXT STEPS

I've created comprehensive code templates. Would you like me to:

1. **Create all referee pages** (8 files)
2. **Create all staff pages** (8 files)  
3. **Create reusable components** for certifications, invitations, etc.
4. **Setup Capacitor** for mobile app

**Or should I focus on one specific page/feature first?**

Let me know which you'd like me to build next, and I'll generate all the production-ready code!


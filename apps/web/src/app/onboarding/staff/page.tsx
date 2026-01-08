import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function StaffOnboardingPage() {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
 <div className="max-w-4xl mx-auto">
 <Card>
 <CardHeader>
 <CardTitle className="text-3xl">Welcome, Staff Member! 👥</CardTitle>
 <CardDescription className="text-lg">
 Your account has been created successfully. Set up your profile to support match operations.
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
 <h3 className="text-xl font-semibold mb-4">Next Steps:</h3>
 <ul className="space-y-3">
 <li className="flex items-start gap-3">
 <span className="text-2xl">1️⃣</span>
 <div>
 <strong>Complete Staff Profile</strong>
 <p className="text-sm text-slate-600">Add your role type and specialization</p>
 </div>
 </li>
 <li className="flex items-start gap-3">
 <span className="text-2xl">2️⃣</span>
 <div>
 <strong>Set Your Availability</strong>
 <p className="text-sm text-slate-600">Let organizers know when you can help</p>
 </div>
 </li>
 <li className="flex items-start gap-3">
 <span className="text-2xl">3️⃣</span>
 <div>
 <strong>Get Event Assignments</strong>
 <p className="text-sm text-slate-600">Support matches and tournaments as needed</p>
 </div>
 </li>
 </ul>
 </div>

 <div className="flex gap-4">
 <Button size="lg" asChild className="flex-1">
 <a href="/dashboard/staff">Complete Profile</a>
 </Button>
 <Button size="lg" variant="outline" asChild className="flex-1">
 <a href="/">Skip for Now</a>
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}

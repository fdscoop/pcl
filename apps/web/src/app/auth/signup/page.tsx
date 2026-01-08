import SignupForm from '@/components/forms/SignupForm'

export default function SignupPage() {
 return (
 <div className="min-h-screen bg-background py-12 px-4">
 <div className="max-w-7xl mx-auto">
 {/* Header */}
 <div className="text-center mb-8">
 <a href="/" className="inline-flex items-center justify-center mb-6 group">
 <img src="/logo.png" alt="PCL Logo" className="h-16 w-16 group-hover:scale-110 transition-transform" />
 </a>
 <h1 className="text-4xl font-bold text-foreground mb-2">
 Join Professional Club League
 </h1>
 <p className="text-lg text-muted-foreground">
 Create your account and start managing your sports journey
 </p>
 </div>

 {/* Signup Form */}
 <SignupForm />
 </div>
 </div>
 )
}

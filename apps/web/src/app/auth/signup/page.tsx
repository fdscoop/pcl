import SignupForm from '@/components/forms/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="PCL Logo" className="h-12 w-12" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              PCL
            </span>
          </a>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Join Professional Club League
          </h1>
          <p className="text-lg text-slate-600">
            Create your account and start managing your sports journey
          </p>
        </div>

        {/* Signup Form */}
        <SignupForm />
      </div>
    </div>
  )
}

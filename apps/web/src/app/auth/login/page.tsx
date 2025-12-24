import LoginForm from '@/components/forms/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center justify-center mb-6 group">
            <img src="/logo.png" alt="PCL Logo" className="h-16 w-16 group-hover:scale-110 transition-transform" />
          </a>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  )
}

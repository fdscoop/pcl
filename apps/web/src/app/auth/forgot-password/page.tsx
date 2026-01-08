import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm'

export default function ForgotPasswordPage() {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-12 px-4">
 <div className="w-full max-w-md">
 {/* Header */}
 <div className="text-center mb-8">
 <a href="/" className="inline-flex items-center gap-2 mb-6">
 <img src="/logo.png" alt="PCL Logo" className="h-12 w-12" />
 <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
 PCL
 </span>
 </a>
 </div>

 {/* Forgot Password Form */}
 <ForgotPasswordForm />
 </div>
 </div>
 )
}

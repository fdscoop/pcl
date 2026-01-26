'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageSquare,
  Shield,
  HelpCircle,
  Building,
  Users
} from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email',
      primary: 'support@professionalclubleague.com',
      secondary: 'info@professionalclubleague.com',
      description: 'We typically respond within 24 hours'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Phone',
      primary: '+91 (0) 123-456-7890',
      secondary: 'Mon-Sat: 9:00 AM - 6:00 PM IST',
      description: 'For urgent queries'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Office Address',
      primary: 'Professional Club League',
      secondary: 'Kerala, India',
      description: 'Visit by appointment only'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Support Hours',
      primary: 'Monday - Saturday',
      secondary: '9:00 AM - 6:00 PM IST',
      description: 'Closed on Sundays and public holidays'
    }
  ]

  const departments = [
    {
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      name: 'Privacy & Data Protection',
      email: 'privacy@professionalclubleague.com',
      description: 'Data privacy and security concerns'
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-green-600" />,
      name: 'Technical Support',
      email: 'tech@professionalclubleague.com',
      description: 'Platform and technical issues'
    },
    {
      icon: <Building className="w-5 h-5 text-purple-600" />,
      name: 'Business & Partnerships',
      email: 'business@professionalclubleague.com',
      description: 'Partnership and collaboration inquiries'
    },
    {
      icon: <Users className="w-5 h-5 text-orange-600" />,
      name: 'Player & Club Support',
      email: 'clubs@professionalclubleague.com',
      description: 'Player registration and club queries'
    }
  ]

  const companyInfo = [
    { label: 'Legal Name', value: 'Professional Club League' },
    { label: 'Startup India ID', value: 'DIPP69878' },
    { label: 'KSUM ID', value: 'DIPP69878/2020/KSUM1031' },
    { label: 'Registration', value: 'Kerala Startup Mission' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/90 to-cyan-600/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-center gap-4 mb-6">
            <MessageSquare className="w-10 h-10 text-foreground" />
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Contact Us</h1>
          </div>
          <p className="text-lg sm:text-xl text-foreground max-w-3xl">
            Have questions? We're here to help. Get in touch with our team for support, 
            inquiries, or feedback about the PCL platform.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 1234567890"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Subject *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help you..."
                      className="resize-none"
                    />
                  </div>

                  {submitStatus === 'success' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="text-green-800 dark:text-green-200 text-sm">
                        ✓ Thank you! Your message has been sent successfully. We'll get back to you soon.
                      </p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-red-800 dark:text-red-200 text-sm">
                        ✗ Failed to send message. Please try again or email us directly.
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Department Contacts */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Department Contacts</CardTitle>
                <CardDescription>
                  Reach out to specific departments for specialized assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {departments.map((dept) => (
                    <div 
                      key={dept.name}
                      className="flex gap-3 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {dept.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{dept.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{dept.description}</p>
                        <a 
                          href={`mailto:${dept.email}`}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {dept.email}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get In Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactMethods.map((method) => (
                  <div key={method.title} className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">{method.title}</h4>
                      <p className="text-sm text-foreground">{method.primary}</p>
                      <p className="text-xs text-muted-foreground">{method.secondary}</p>
                      <p className="text-xs text-muted-foreground mt-1">{method.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {companyInfo.map((info) => (
                  <div key={info.label} className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">{info.label}</span>
                    <span className="text-sm font-medium text-foreground text-right">{info.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link 
                  href="/faq"
                  className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  → FAQ & Help Center
                </Link>
                <Link 
                  href="/legal/privacy-policy"
                  className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  → Privacy Policy
                </Link>
                <Link 
                  href="/legal/terms-and-conditions"
                  className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  → Terms and Conditions
                </Link>
                <Link 
                  href="/legal/refund-policy"
                  className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  → Refund & Cancellation Policy
                </Link>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
              <CardHeader>
                <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                  Emergency Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                  For urgent platform issues affecting live matches or tournaments:
                </p>
                <a 
                  href="tel:+911234567890"
                  className="text-sm font-semibold text-orange-800 dark:text-orange-200 hover:underline"
                >
                  📞 +91 123-456-7890
                </a>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  Available during support hours
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

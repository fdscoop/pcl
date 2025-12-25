'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  FileText, 
  Shield, 
  CreditCard, 
  Users, 
  Gavel, 
  Scale,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

export default function LegalIndexPage() {
  const legalPages = [
    {
      title: "Privacy Policy",
      description: "How we collect, use, and protect your personal information",
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      href: "/legal/privacy-policy",
      topics: ["Data Collection", "Information Usage", "Security Measures", "User Rights"]
    },
    {
      title: "Terms and Conditions",
      description: "Terms of use for the PCL platform and services",
      icon: <FileText className="h-8 w-8 text-purple-600" />,
      href: "/legal/terms-and-conditions",
      topics: ["Service Terms", "User Responsibilities", "Intellectual Property", "Liability"]
    },
    {
      title: "Refund Policy",
      description: "Refund terms for bookings, memberships, and transactions",
      icon: <CreditCard className="h-8 w-8 text-green-600" />,
      href: "/legal/refund-policy",
      topics: ["Stadium Bookings", "Tournament Fees", "Membership Refunds", "Processing Times"]
    },
    {
      title: "Membership Policies",
      description: "Guidelines for all PCL member categories and their privileges",
      icon: <Users className="h-8 w-8 text-orange-600" />,
      href: "/legal/membership-policies",
      topics: ["Player Membership", "Club Registration", "Stadium Owners", "Referees & Staff"]
    },
    {
      title: "Code of Conduct",
      description: "Professional standards and behavioral expectations",
      icon: <Scale className="h-8 w-8 text-red-600" />,
      href: "/legal/code-of-conduct",
      topics: ["Core Values", "Professional Standards", "Prohibited Conduct", "Reporting Process"]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Legal Documentation</h1>
            <p className="text-xl opacity-90 mb-8">
              Comprehensive legal policies and guidelines for the Professional Club League
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>DIPP Registered Startup</span>
                </div>
                <div className="h-4 w-px bg-white/30"></div>
                <div>ID: DIPP69878</div>
                <div className="h-4 w-px bg-white/30"></div>
                <div>KSUM ID: DIPP69878/2020/KSUM1031</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transparency and Compliance
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Professional Club League is committed to operating with complete transparency and 
            legal compliance. Our comprehensive legal documentation ensures all stakeholders 
            understand their rights, responsibilities, and the standards we maintain.
          </p>
        </div>

        {/* Legal Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {legalPages.map((page, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {page.icon}
                </div>
                <CardTitle className="text-xl font-bold">{page.title}</CardTitle>
                <CardDescription className="text-gray-600">
                  {page.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Topics Covered */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Topics:</h4>
                  <ul className="space-y-1">
                    {page.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2"></div>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Read More Button */}
                <Link href={page.href}>
                  <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 group-hover:shadow-md transition-all duration-300">
                    Read Full Document
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Quick Legal Links</h3>
            <p className="text-gray-600">
              Fast access to specific legal information and contact details
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/legal/privacy-policy#contact">
              <Button variant="outline" className="w-full justify-start hover:bg-white">
                <Shield className="mr-2 h-4 w-4" />
                Data Protection
              </Button>
            </Link>
            <Link href="/legal/refund-policy#process">
              <Button variant="outline" className="w-full justify-start hover:bg-white">
                <CreditCard className="mr-2 h-4 w-4" />
                Request Refund
              </Button>
            </Link>
            <Link href="/legal/membership-policies#fees">
              <Button variant="outline" className="w-full justify-start hover:bg-white">
                <Users className="mr-2 h-4 w-4" />
                Membership Info
              </Button>
            </Link>
            <Link href="/legal/code-of-conduct#reporting">
              <Button variant="outline" className="w-full justify-start hover:bg-white">
                <Gavel className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            </Link>
          </div>
        </div>

        {/* Contact Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Legal Support and Contact</CardTitle>
            <CardDescription>
              Need assistance or have questions about our policies?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">General Legal Inquiries</h4>
                <p className="text-sm text-gray-600">legal@professionalclubleague.com</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Privacy and Data Protection</h4>
                <p className="text-sm text-gray-600">privacy@professionalclubleague.com</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Ethics and Compliance</h4>
                <p className="text-sm text-gray-600">ethics@professionalclubleague.com</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                <strong>Professional Club League (PCL)</strong><br />
                Startup ID: DIPP69878 | KSUM ID: DIPP69878/2020/KSUM1031<br />
                Last Updated: December 25, 2025
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
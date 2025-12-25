'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl opacity-90">
            How we collect, use, and protect your personal information
          </p>
          <div className="mt-6 text-sm opacity-75">
            <p>Company: Professional Club League (PCL)</p>
            <p>Startup ID: DIPP69878</p>
            <p>KSUM ID: DIPP69878/2020/KSUM1031</p>
            <p>Last updated: December 25, 2025</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Professional Club League ("PCL", "we", "our", or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you visit our platform and use our sports management services.
              </p>
              <p>
                PCL is a registered startup under the Department for Promotion of Industry and Internal Trade (DIPP) 
                with Startup ID: DIPP69878 and KSUM ID: DIPP69878/2020/KSUM1031.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle>2. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">2.1 Personal Information</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, date of birth</li>
                <li><strong>Profile Information:</strong> Profile photos, bio, sports preferences</li>
                <li><strong>Identity Verification:</strong> KYC documents, government-issued IDs</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by third-party providers)</li>
              </ul>

              <h4 className="font-semibold mt-6">2.2 Sports-Specific Information</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Player Data:</strong> Position, statistics, match history, performance metrics</li>
                <li><strong>Club Data:</strong> Club details, team rosters, match schedules</li>
                <li><strong>Stadium Data:</strong> Venue information, booking details, availability</li>
                <li><strong>Tournament Data:</strong> Participation records, results, rankings</li>
              </ul>

              <h4 className="font-semibold mt-6">2.3 Technical Information</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP address, browser type, device information</li>
                <li>Usage data, session information, cookies</li>
                <li>Location data (with your permission)</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle>3. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our sports management platform</li>
                <li>Process registrations, bookings, and payments</li>
                <li>Facilitate player scouting and club management</li>
                <li>Organize tournaments and match scheduling</li>
                <li>Verify user identity and prevent fraud</li>
                <li>Send important notifications and updates</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations and regulations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>4. Information Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">4.1 We may share your information with:</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Other Users:</strong> Profile information visible to clubs, players, and scouts</li>
                <li><strong>Service Providers:</strong> Third-party vendors who assist our operations</li>
                <li><strong>Payment Processors:</strong> Secure payment gateways for transactions</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</li>
              </ul>

              <h4 className="font-semibold mt-6">4.2 We do NOT sell your personal information to third parties.</h4>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle>5. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Secure cloud infrastructure and backup systems</li>
                <li>Staff training on data protection practices</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>6. Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and review your personal information</li>
                <li>Update or correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability (receive your data in a structured format)</li>
                <li>File complaints with data protection authorities</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>7. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>For privacy-related questions or concerns, contact us at:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p><strong>Professional Club League (PCL)</strong></p>
                <p>Email: privacy@professionalclubleague.com</p>
                <p>Phone: +91 [Your Phone Number]</p>
                <p>Address: [Your Business Address]</p>
                <p>Startup ID: DIPP69878</p>
                <p>KSUM ID: DIPP69878/2020/KSUM1031</p>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader>
              <CardTitle>8. Policy Updates</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date. 
                Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
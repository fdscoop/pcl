'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-xl opacity-90">
            Terms of use for the Professional Club League platform
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
          {/* Acceptance */}
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                By accessing and using the Professional Club League (PCL) platform, you agree to be bound by these 
                Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.
              </p>
              <p>
                PCL is operated by Professional Club League, a startup registered under DIPP with 
                Startup ID: DIPP69878 and KSUM ID: DIPP69878/2020/KSUM1031.
              </p>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>2. Our Services</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">2.1 Platform Services</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Player registration and profile management</li>
                <li>Club creation and team management</li>
                <li>Stadium booking and venue management</li>
                <li>Tournament organization and participation</li>
                <li>Referee and staff coordination</li>
                <li>Match scheduling and result tracking</li>
                <li>Player scouting and club recruitment</li>
              </ul>

              <h4 className="font-semibold mt-6">2.2 User Categories</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Players:</strong> Individual athletes participating in sports</li>
                <li><strong>Club Owners:</strong> Organizations managing sports teams</li>
                <li><strong>Stadium Owners:</strong> Venue providers for sports events</li>
                <li><strong>Referees:</strong> Officials overseeing matches and tournaments</li>
                <li><strong>Staff/Volunteers:</strong> Support personnel for events</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle>3. User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">3.1 Account Security</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain confidentiality of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Provide accurate and up-to-date information</li>
                <li>Complete KYC verification when required</li>
              </ul>

              <h4 className="font-semibold mt-6">3.2 Prohibited Activities</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Creating fake or duplicate accounts</li>
                <li>Sharing false or misleading information</li>
                <li>Engaging in harassment or discriminatory behavior</li>
                <li>Attempting to breach platform security</li>
                <li>Using the platform for illegal activities</li>
                <li>Interfering with other users' experience</li>
              </ul>
            </CardContent>
          </Card>

          {/* Payments and Fees */}
          <Card>
            <CardHeader>
              <CardTitle>4. Payments and Fees</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">4.1 Service Fees</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Membership fees for premium features</li>
                <li>Tournament registration fees</li>
                <li>Stadium booking charges</li>
                <li>Processing fees for transactions</li>
              </ul>

              <h4 className="font-semibold mt-6">4.2 Payment Terms</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>All fees are payable in advance unless otherwise specified</li>
                <li>Payments are processed through secure third-party providers</li>
                <li>Refunds are subject to our Refund Policy</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>5. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">5.1 Platform Content</h4>
              <p>
                All content, features, and functionality of the PCL platform, including but not limited to text, 
                graphics, logos, icons, images, audio clips, and software, are owned by PCL and protected by 
                copyright, trademark, and other intellectual property laws.
              </p>

              <h4 className="font-semibold mt-6">5.2 User Content</h4>
              <p>
                You retain ownership of content you submit to the platform but grant PCL a license to use, 
                display, and distribute such content for platform operations and promotional purposes.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle>6. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                To the maximum extent permitted by law, PCL shall not be liable for any indirect, incidental, 
                special, or consequential damages arising from your use of the platform, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Loss of profits or business opportunities</li>
                <li>Data loss or corruption</li>
                <li>Interruption of services</li>
                <li>Third-party actions or content</li>
                <li>Injuries occurring during sports activities</li>
              </ul>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>7. Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">7.1 Termination by You</h4>
              <p>You may terminate your account at any time by contacting our support team.</p>

              <h4 className="font-semibold mt-6">7.2 Termination by PCL</h4>
              <p>
                We reserve the right to suspend or terminate your account if you violate these terms, 
                engage in fraudulent activities, or for any other reason at our sole discretion.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>8. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                These Terms and Conditions are governed by and construed in accordance with the laws of India. 
                Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the 
                courts in [Your City/State].
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>9. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>For questions about these Terms and Conditions, contact us at:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p><strong>Professional Club League (PCL)</strong></p>
                <p>Email: legal@professionalclubleague.com</p>
                <p>Phone: +91 [Your Phone Number]</p>
                <p>Address: [Your Business Address]</p>
                <p>Startup ID: DIPP69878</p>
                <p>KSUM ID: DIPP69878/2020/KSUM1031</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
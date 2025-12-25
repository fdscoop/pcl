'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-xl opacity-90">
            Refund terms for PCL platform services and transactions
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
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>1. Refund Policy Overview</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Professional Club League (PCL) is committed to providing fair and transparent refund policies 
                for all services offered on our platform. This policy outlines the conditions under which 
                refunds may be requested and processed.
              </p>
              <p>
                All refund requests are subject to review and approval by our support team. Processing times 
                may vary depending on the payment method and financial institution.
              </p>
            </CardContent>
          </Card>

          {/* Stadium Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>2. Stadium Booking Refunds</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">2.1 Cancellation Timeline</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>48+ hours before booking:</strong> 100% refund minus processing fees</li>
                <li><strong>24-48 hours before booking:</strong> 75% refund</li>
                <li><strong>12-24 hours before booking:</strong> 50% refund</li>
                <li><strong>Less than 12 hours:</strong> No refund</li>
              </ul>

              <h4 className="font-semibold mt-6">2.2 Exceptional Circumstances</h4>
              <p>Full refunds may be provided in cases of:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Weather-related cancellations</li>
                <li>Stadium facility unavailability</li>
                <li>Government restrictions or emergencies</li>
                <li>Medical emergencies with proper documentation</li>
              </ul>
            </CardContent>
          </Card>

          {/* Tournament Fees */}
          <Card>
            <CardHeader>
              <CardTitle>3. Tournament Registration Refunds</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">3.1 Pre-Tournament Cancellation</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>7+ days before tournament:</strong> 90% refund</li>
                <li><strong>3-7 days before tournament:</strong> 75% refund</li>
                <li><strong>1-3 days before tournament:</strong> 50% refund</li>
                <li><strong>Day of tournament:</strong> No refund</li>
              </ul>

              <h4 className="font-semibold mt-6">3.2 Tournament Cancellation by Organizer</h4>
              <p>
                If a tournament is cancelled by the organizer or PCL, participants will receive a 100% refund 
                of registration fees within 7-10 business days.
              </p>
            </CardContent>
          </Card>

          {/* Membership Fees */}
          <Card>
            <CardHeader>
              <CardTitle>4. Membership and Subscription Refunds</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">4.1 Premium Membership</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Monthly subscriptions:</strong> Prorated refund if cancelled within 7 days</li>
                <li><strong>Annual subscriptions:</strong> Prorated refund if cancelled within 30 days</li>
                <li><strong>Used benefits:</strong> Refund amount adjusted for utilized features</li>
              </ul>

              <h4 className="font-semibold mt-6">4.2 Club Membership Fees</h4>
              <p>
                Club membership fees are generally non-refundable once the season has commenced. 
                Exceptions may be made for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Permanent relocation with proof of address change</li>
                <li>Long-term medical conditions preventing participation</li>
                <li>Military deployment or similar obligations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service Fees */}
          <Card>
            <CardHeader>
              <CardTitle>5. Service and Processing Fees</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">5.1 Non-Refundable Fees</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processing charges (2-3% of transaction)</li>
                <li>KYC verification fees</li>
                <li>Document processing charges</li>
                <li>Platform service fees (where applicable)</li>
              </ul>

              <h4 className="font-semibold mt-6">5.2 Refundable Services</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Profile verification badges (if service not provided)</li>
                <li>Featured listing fees (if technical issues prevent display)</li>
                <li>Premium support subscriptions (within 48 hours of purchase)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Refund Process */}
          <Card>
            <CardHeader>
              <CardTitle>6. Refund Request Process</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">6.1 How to Request a Refund</h4>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Log into your PCL account</li>
                <li>Navigate to "My Transactions" or "Billing History"</li>
                <li>Select the transaction you wish to refund</li>
                <li>Click "Request Refund" and provide reason</li>
                <li>Submit any required documentation</li>
                <li>Await review and approval notification</li>
              </ol>

              <h4 className="font-semibold mt-6">6.2 Processing Timeline</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Review period:</strong> 2-5 business days</li>
                <li><strong>Credit card refunds:</strong> 5-10 business days after approval</li>
                <li><strong>Bank transfer refunds:</strong> 3-7 business days after approval</li>
                <li><strong>Digital wallet refunds:</strong> 1-3 business days after approval</li>
              </ul>
            </CardContent>
          </Card>

          {/* Special Circumstances */}
          <Card>
            <CardHeader>
              <CardTitle>7. Special Circumstances</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">7.1 Force Majeure Events</h4>
              <p>
                In cases of natural disasters, pandemics, government restrictions, or other unforeseeable 
                circumstances, PCL will work with users to provide fair resolutions, which may include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Full refunds regardless of standard policy</li>
                <li>Credit towards future bookings or services</li>
                <li>Rescheduling without additional charges</li>
              </ul>

              <h4 className="font-semibold mt-6">7.2 Dispute Resolution</h4>
              <p>
                If you disagree with a refund decision, you may appeal by contacting our customer service 
                team with additional documentation or circumstances.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>8. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>For refund requests or questions about this policy, contact us at:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p><strong>Professional Club League (PCL)</strong></p>
                <p><strong>Refunds Department</strong></p>
                <p>Email: refunds@professionalclubleague.com</p>
                <p>Support Email: support@professionalclubleague.com</p>
                <p>Phone: +91 [Your Phone Number]</p>
                <p>Business Hours: Monday-Friday, 9:00 AM - 6:00 PM IST</p>
                <p>Startup ID: DIPP69878</p>
                <p>KSUM ID: DIPP69878/2020/KSUM1031</p>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Please allow 24-48 hours for email responses. For urgent refund requests, 
                please call during business hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
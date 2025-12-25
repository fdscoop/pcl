'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MembershipPoliciesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Membership Policies</h1>
          <p className="text-xl opacity-90">
            Comprehensive membership guidelines for all PCL user categories
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
              <CardTitle>1. Membership Overview</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Professional Club League (PCL) offers various membership categories designed to serve 
                different participants in the sports ecosystem. Each membership type has specific 
                privileges, responsibilities, and requirements.
              </p>
              <p>
                All members must comply with PCL's Terms and Conditions, Code of Conduct, and applicable 
                sports regulations.
              </p>
            </CardContent>
          </Card>

          {/* Player Membership */}
          <Card>
            <CardHeader>
              <CardTitle>2. Player Membership</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">2.1 Eligibility Requirements</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Minimum age: 16 years (with parental consent for minors)</li>
                <li>Valid government-issued identification</li>
                <li>Completed health and fitness declaration</li>
                <li>Signed liability waiver and code of conduct agreement</li>
                <li>Verification of previous playing experience (if applicable)</li>
              </ul>

              <h4 className="font-semibold mt-6">2.2 Player Rights and Benefits</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Profile visibility to scouts and club recruiters</li>
                <li>Tournament participation opportunities</li>
                <li>Access to training resources and guides</li>
                <li>Performance statistics tracking</li>
                <li>Networking with clubs and other players</li>
                <li>Career development support</li>
              </ul>

              <h4 className="font-semibold mt-6">2.3 Player Responsibilities</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain accurate and updated profile information</li>
                <li>Adhere to fair play and sportsmanship principles</li>
                <li>Comply with anti-doping regulations</li>
                <li>Respect other players, officials, and spectators</li>
                <li>Report any injuries or health issues promptly</li>
                <li>Participate in mandatory training sessions (if contracted)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Club Membership */}
          <Card>
            <CardHeader>
              <CardTitle>3. Club Membership</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">3.1 Club Registration Requirements</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Legal business registration or sports association certification</li>
                <li>Designated authorized signatory for contracts</li>
                <li>Valid insurance coverage for players and facilities</li>
                <li>Compliance with local sports authority regulations</li>
                <li>Financial capacity verification for player contracts</li>
                <li>Coaching staff credentials and certifications</li>
              </ul>

              <h4 className="font-semibold mt-6">3.2 Club Privileges</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Player recruitment and scouting access</li>
                <li>Tournament organization and participation</li>
                <li>Stadium booking and event management</li>
                <li>Revenue sharing opportunities</li>
                <li>Sponsorship and partnership facilitation</li>
                <li>Marketing and promotional support</li>
              </ul>

              <h4 className="font-semibold mt-6">3.3 Club Obligations</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide safe and professional training environment</li>
                <li>Honor all player contracts and financial obligations</li>
                <li>Maintain transparent financial records</li>
                <li>Implement proper governance and management structures</li>
                <li>Ensure compliance with league regulations</li>
                <li>Report significant incidents or rule violations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Stadium Owner Membership */}
          <Card>
            <CardHeader>
              <CardTitle>4. Stadium Owner Membership</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">4.1 Venue Requirements</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Valid property ownership or long-term lease documentation</li>
                <li>Safety certifications and compliance with building codes</li>
                <li>Adequate facilities (changing rooms, restrooms, parking)</li>
                <li>Emergency response procedures and equipment</li>
                <li>Insurance coverage for public liability</li>
                <li>Accessibility compliance for disabled individuals</li>
              </ul>

              <h4 className="font-semibold mt-6">4.2 Revenue Opportunities</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Rental fees from clubs and tournament organizers</li>
                <li>Concession and merchandise sales</li>
                <li>Advertising and sponsorship revenue</li>
                <li>Event hosting and facility management</li>
                <li>Training camp accommodations</li>
              </ul>

              <h4 className="font-semibold mt-6">4.3 Service Standards</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain clean and well-maintained facilities</li>
                <li>Provide reliable scheduling and booking systems</li>
                <li>Ensure adequate security and crowd management</li>
                <li>Offer competitive and transparent pricing</li>
                <li>Respond promptly to booking requests and inquiries</li>
              </ul>
            </CardContent>
          </Card>

          {/* Referee and Officials */}
          <Card>
            <CardHeader>
              <CardTitle>5. Referee and Officials Membership</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">5.1 Certification Requirements</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Valid officiating license from recognized sports authority</li>
                <li>Completed referee training and education programs</li>
                <li>Physical fitness certification</li>
                <li>Background check and character verification</li>
                <li>Continuing education and skill development</li>
                <li>Insurance coverage for officiating activities</li>
              </ul>

              <h4 className="font-semibold mt-6">5.2 Assignment Process</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Match assignments based on certification level and availability</li>
                <li>Fair rotation and equal opportunity policies</li>
                <li>Performance evaluation and feedback system</li>
                <li>Compensation according to match level and duration</li>
                <li>Travel and accommodation support for distant matches</li>
              </ul>

              <h4 className="font-semibold mt-6">5.3 Professional Standards</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain impartiality and integrity in all decisions</li>
                <li>Arrive punctually and properly equipped for matches</li>
                <li>Enforce rules consistently and fairly</li>
                <li>Communicate effectively with players, coaches, and spectators</li>
                <li>Submit accurate match reports and incident documentation</li>
                <li>Participate in ongoing training and development programs</li>
              </ul>
            </CardContent>
          </Card>

          {/* Staff and Volunteers */}
          <Card>
            <CardHeader>
              <CardTitle>6. Staff and Volunteer Membership</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">6.1 Categories</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Event Staff:</strong> Tournament organizers, coordinators, technical support</li>
                <li><strong>Medical Personnel:</strong> Doctors, physiotherapists, first aid providers</li>
                <li><strong>Support Staff:</strong> Groundskeepers, equipment managers, security</li>
                <li><strong>Volunteers:</strong> Community supporters, student assistants, retirees</li>
                <li><strong>Media Personnel:</strong> Photographers, journalists, broadcasters</li>
              </ul>

              <h4 className="font-semibold mt-6">6.2 Requirements</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Background verification and character references</li>
                <li>Relevant qualifications or experience (for specialized roles)</li>
                <li>Completion of orientation and training programs</li>
                <li>Commitment to PCL values and code of conduct</li>
                <li>Availability for assigned duties and responsibilities</li>
              </ul>

              <h4 className="font-semibold mt-6">6.3 Benefits and Recognition</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Skill development and training opportunities</li>
                <li>Networking with sports industry professionals</li>
                <li>Recognition awards and certificates</li>
                <li>Priority access to sports events and activities</li>
                <li>Career advancement pathways within PCL</li>
              </ul>
            </CardContent>
          </Card>

          {/* Membership Fees */}
          <Card>
            <CardHeader>
              <CardTitle>7. Membership Fees and Renewal</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">7.1 Fee Structure</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Player Membership:</strong> ₹2,500/year (Basic), ₹5,000/year (Premium)</li>
                  <li><strong>Club Membership:</strong> ₹25,000/year + revenue sharing</li>
                  <li><strong>Stadium Owner:</strong> ₹15,000/year + transaction fees</li>
                  <li><strong>Referee Membership:</strong> ₹1,500/year</li>
                  <li><strong>Staff/Volunteer:</strong> Free registration</li>
                </ul>
              </div>

              <h4 className="font-semibold mt-6">7.2 Renewal Process</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Annual renewal required for all paid memberships</li>
                <li>30-day grace period for late renewals</li>
                <li>Automatic renewal available with saved payment methods</li>
                <li>Updated documentation required every three years</li>
                <li>Early renewal discounts available (10% off if renewed 60 days early)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>8. Membership Support</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>For membership inquiries, applications, or support:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p><strong>Professional Club League (PCL)</strong></p>
                <p><strong>Membership Services</strong></p>
                <p>Email: membership@professionalclubleague.com</p>
                <p>Support: support@professionalclubleague.com</p>
                <p>Phone: +91 [Your Phone Number]</p>
                <p>Business Hours: Monday-Friday, 9:00 AM - 6:00 PM IST</p>
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
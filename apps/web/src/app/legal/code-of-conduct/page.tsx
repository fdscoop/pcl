'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CodeOfConductPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">PCL Code of Conduct</h1>
          <p className="text-xl opacity-90">
            Professional standards and behavioral expectations for all PCL community members
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
              <CardTitle>1. Our Commitment</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Professional Club League (PCL) is dedicated to creating an inclusive, respectful, and 
                professional sports environment for all participants. This Code of Conduct applies to 
                all members, including players, clubs, stadium owners, referees, staff, and volunteers.
              </p>
              <p>
                By joining the PCL community, you agree to uphold these standards and contribute to 
                a positive sporting culture that promotes excellence, integrity, and fair play.
              </p>
            </CardContent>
          </Card>

          {/* Core Values */}
          <Card>
            <CardHeader>
              <CardTitle>2. Core Values</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">2.1 Integrity</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Honesty in all dealings and communications</li>
                <li>Transparency in financial transactions and contracts</li>
                <li>Truthful representation of skills, qualifications, and experience</li>
                <li>Adherence to rules and regulations without seeking unfair advantages</li>
              </ul>

              <h4 className="font-semibold mt-6">2.2 Respect</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Treating all individuals with dignity regardless of background</li>
                <li>Valuing diversity in gender, race, religion, and cultural differences</li>
                <li>Respecting opponents, teammates, officials, and spectators</li>
                <li>Appreciating different skill levels and experience</li>
              </ul>

              <h4 className="font-semibold mt-6">2.3 Excellence</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Striving for continuous improvement and personal development</li>
                <li>Commitment to training, preparation, and professional growth</li>
                <li>Maintaining high standards in all aspects of participation</li>
                <li>Supporting others in achieving their potential</li>
              </ul>

              <h4 className="font-semibold mt-6">2.4 Fair Play</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Competing within the spirit and rules of the sport</li>
                <li>Accepting victories and defeats with grace and humility</li>
                <li>Supporting teammates and acknowledging opponents' achievements</li>
                <li>Reporting rule violations and maintaining sporting integrity</li>
              </ul>
            </CardContent>
          </Card>

          {/* Player Code of Conduct */}
          <Card>
            <CardHeader>
              <CardTitle>3. Player Code of Conduct</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">3.1 On-Field Behavior</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Play within the rules and spirit of the game</li>
                <li>Respect referees and officials, even when disagreeing with decisions</li>
                <li>Avoid aggressive, violent, or unsporting behavior</li>
                <li>Help injured opponents and show concern for their welfare</li>
                <li>Accept coaching instructions and team strategies</li>
              </ul>

              <h4 className="font-semibold mt-6">3.2 Off-Field Conduct</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain professional appearance and behavior in public</li>
                <li>Avoid activities that could bring PCL or your club into disrepute</li>
                <li>Respect social media guidelines and represent PCL positively online</li>
                <li>Comply with anti-doping policies and health regulations</li>
                <li>Honor contractual obligations and financial commitments</li>
              </ul>

              <h4 className="font-semibold mt-6">3.3 Training and Development</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Attend training sessions punctually and prepared</li>
                <li>Maintain physical fitness and health standards</li>
                <li>Participate actively in skill development programs</li>
                <li>Mentor junior players and support team development</li>
                <li>Communicate openly with coaches and management</li>
              </ul>
            </CardContent>
          </Card>

          {/* Club and Organization Standards */}
          <Card>
            <CardHeader>
              <CardTitle>4. Club and Organization Standards</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">4.1 Governance and Management</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Implement transparent and fair selection processes</li>
                <li>Maintain proper financial records and accountability</li>
                <li>Provide equal opportunities regardless of background</li>
                <li>Establish clear communication channels with players and staff</li>
                <li>Ensure compliance with all league regulations and policies</li>
              </ul>

              <h4 className="font-semibold mt-6">4.2 Player Welfare</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide safe training and playing environments</li>
                <li>Ensure adequate medical support and injury prevention</li>
                <li>Honor all contractual agreements and payment schedules</li>
                <li>Support player development and career advancement</li>
                <li>Maintain confidentiality of personal and medical information</li>
              </ul>

              <h4 className="font-semibold mt-6">4.3 Community Engagement</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Participate in community development programs</li>
                <li>Promote sports participation at grassroots levels</li>
                <li>Support local sports infrastructure and facilities</li>
                <li>Engage in charitable activities and social responsibility</li>
                <li>Foster positive relationships with supporters and sponsors</li>
              </ul>
            </CardContent>
          </Card>

          {/* Referee and Officials Standards */}
          <Card>
            <CardHeader>
              <CardTitle>5. Referee and Officials Standards</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">5.1 Match Officials</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain impartiality and avoid conflicts of interest</li>
                <li>Apply rules consistently and fairly for all participants</li>
                <li>Communicate decisions clearly and professionally</li>
                <li>Arrive punctually and properly equipped for assignments</li>
                <li>Submit accurate and timely match reports</li>
              </ul>

              <h4 className="font-semibold mt-6">5.2 Continuous Development</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Participate in ongoing training and certification programs</li>
                <li>Stay updated with rule changes and regulations</li>
                <li>Seek feedback and work on areas for improvement</li>
                <li>Mentor new officials and share knowledge</li>
                <li>Maintain physical fitness appropriate for officiating level</li>
              </ul>
            </CardContent>
          </Card>

          {/* Prohibited Conduct */}
          <Card>
            <CardHeader>
              <CardTitle>6. Prohibited Conduct</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">6.1 Zero Tolerance Behaviors</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Discrimination based on race, gender, religion, sexual orientation, or nationality</li>
                <li>Harassment, bullying, or intimidation of any form</li>
                <li>Violence or threats of violence against any person</li>
                <li>Use of abusive, offensive, or inappropriate language</li>
                <li>Match-fixing, betting, or any form of corruption</li>
                <li>Use of performance-enhancing drugs or banned substances</li>
              </ul>

              <h4 className="font-semibold mt-6">6.2 Serious Misconduct</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Deliberately injuring or attempting to injure opponents</li>
                <li>Bringing PCL into disrepute through public actions or statements</li>
                <li>Violation of contractual obligations or financial fraud</li>
                <li>Breach of confidentiality or misuse of sensitive information</li>
                <li>Repeated violations of PCL rules and regulations</li>
              </ul>

              <h4 className="font-semibold mt-6">6.3 Social Media and Public Conduct</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting offensive, defamatory, or inappropriate content</li>
                <li>Sharing confidential information about clubs, players, or PCL operations</li>
                <li>Engaging in online harassment or cyberbullying</li>
                <li>Promoting illegal activities or substances</li>
                <li>Misrepresenting PCL positions or making unauthorized statements</li>
              </ul>
            </CardContent>
          </Card>

          {/* Reporting and Enforcement */}
          <Card>
            <CardHeader>
              <CardTitle>7. Reporting and Enforcement</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold">7.1 Reporting Violations</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>All members have a responsibility to report code violations</li>
                <li>Anonymous reporting options available for sensitive issues</li>
                <li>Protection for whistle-blowers against retaliation</li>
                <li>Prompt investigation of all reported incidents</li>
                <li>Regular updates to reporting parties on investigation progress</li>
              </ul>

              <h4 className="font-semibold mt-6">7.2 Disciplinary Actions</h4>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="font-semibold">Progressive Discipline Framework:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Warning:</strong> Formal written notice for minor violations</li>
                  <li><strong>Suspension:</strong> Temporary exclusion from activities (1-6 months)</li>
                  <li><strong>Fines:</strong> Financial penalties proportionate to violation severity</li>
                  <li><strong>Expulsion:</strong> Permanent removal from PCL for serious misconduct</li>
                  <li><strong>Legal Action:</strong> Criminal or civil proceedings for illegal activities</li>
                </ul>
              </div>

              <h4 className="font-semibold mt-6">7.3 Appeal Process</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Right to appeal disciplinary decisions within 30 days</li>
                <li>Independent review panel for appeal hearings</li>
                <li>Opportunity to present evidence and witnesses</li>
                <li>Final decisions binding on all parties</li>
                <li>Reinstatement procedures for successfully appealed cases</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>8. Ethics and Compliance Contact</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>To report violations or seek guidance on ethical issues:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p><strong>Professional Club League (PCL)</strong></p>
                <p><strong>Ethics and Compliance Department</strong></p>
                <p>Email: ethics@professionalclubleague.com</p>
                <p>Hotline: +91 [Your Hotline Number] (Available 24/7)</p>
                <p>Confidential Reporting: report@professionalclubleague.com</p>
                <p>Business Hours: Monday-Friday, 9:00 AM - 6:00 PM IST</p>
                <p>Startup ID: DIPP69878</p>
                <p>KSUM ID: DIPP69878/2020/KSUM1031</p>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                All reports are treated confidentially and investigated promptly. 
                No retaliation will be tolerated against individuals who report violations in good faith.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
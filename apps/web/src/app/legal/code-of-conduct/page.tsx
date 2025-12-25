'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Mail, Phone, MapPin } from 'lucide-react'

export default function CodeOfConductPage() {
  const sections = [
    { id: 'commitment', title: '1. Our Commitment', icon: '💼' },
    { id: 'values', title: '2. Core Values', icon: '⭐' },
    { id: 'players', title: '3. Player Code of Conduct', icon: '⚽' },
    { id: 'clubs', title: '4. Club and Organization Standards', icon: '🏛️' },
    { id: 'referees', title: '5. Referee and Officials', icon: '🏆' },
    { id: 'prohibited', title: '6. Prohibited Conduct', icon: '🚫' },
    { id: 'enforcement', title: '7. Reporting and Enforcement', icon: '⚖️' },
    { id: 'contact', title: '8. Ethics and Compliance Contact', icon: '📞' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="w-10 h-10 text-foreground" />
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Code of Conduct</h1>
          </div>
          <p className="text-lg sm:text-xl text-foreground max-w-2xl mb-8">
            Professional standards and behavioral expectations for all PCL community members
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-foreground">
            <div>
              <p className="font-semibold">Company</p>
              <p>Professional Club League</p>
            </div>
            <div>
              <p className="font-semibold">Startup ID</p>
              <p>DIPP69878</p>
            </div>
            <div>
              <p className="font-semibold">KSUM ID</p>
              <p>DIPP69878/2020/KSUM1031</p>
            </div>
            <div>
              <p className="font-semibold">Updated</p>
              <p>Dec 25, 2025</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
                Quick Navigation
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 px-3 py-2 rounded-md transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <Card id="commitment">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>💼</span>
                  1. Our Commitment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-foreground">
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

            <Card id="values">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>⭐</span>
                  2. Core Values
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3">2.1 Integrity</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Honesty in all dealings and communications</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Transparency in financial transactions and contracts</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Truthful representation of skills, qualifications, and experience</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Adherence to rules and regulations without seeking unfair advantages</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">2.2 Respect</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Treating all individuals with dignity regardless of background</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Valuing diversity in gender, race, religion, and cultural differences</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Respecting opponents, teammates, officials, and spectators</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Appreciating different skill levels and experience</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">2.3 Excellence</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Striving for continuous improvement and personal development</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Commitment to training, preparation, and professional growth</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Maintaining high standards in all aspects of participation</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Supporting others in achieving their potential</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">2.4 Fair Play</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Competing within the spirit and rules of the sport</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Accepting victories and defeats with grace and humility</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Supporting teammates and acknowledging opponents' achievements</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Reporting rule violations and maintaining sporting integrity</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card id="players">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>⚽</span>
                  3. Player Code of Conduct
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3">3.1 On-Field Behavior</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Play within the rules and spirit of the game</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Respect referees and officials, even when disagreeing with decisions</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Avoid aggressive, violent, or unsporting behavior</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Help injured opponents and show concern for their welfare</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Accept coaching instructions and team strategies</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">3.2 Off-Field Conduct</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Maintain professional appearance and behavior in public</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Avoid activities that could bring PCL or your club into disrepute</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Respect social media guidelines and represent PCL positively online</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Comply with anti-doping policies and health regulations</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Honor contractual obligations and financial commitments</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">3.3 Training and Development</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Attend training sessions punctually and prepared</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Maintain physical fitness and health standards</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Participate actively in skill development programs</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Mentor junior players and support team development</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Communicate openly with coaches and management</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card id="clubs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🏛️</span>
                  4. Club and Organization Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3">4.1 Governance and Management</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Implement transparent and fair selection processes</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Maintain proper financial records and accountability</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Provide equal opportunities regardless of background</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Establish clear communication channels with players and staff</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Ensure compliance with all league regulations and policies</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">4.2 Player Welfare</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Provide safe training and playing environments</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Ensure adequate medical support and injury prevention</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Honor all contractual agreements and payment schedules</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Support player development and career advancement</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Maintain confidentiality of personal and medical information</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">4.3 Community Engagement</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Participate in community development programs</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Promote sports participation at grassroots levels</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Support local sports infrastructure and facilities</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Engage in charitable activities and social responsibility</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Foster positive relationships with supporters and sponsors</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card id="referees">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🏆</span>
                  5. Referee and Officials Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3">5.1 Match Officials</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Maintain impartiality and avoid conflicts of interest</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Apply rules consistently and fairly for all participants</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Communicate decisions clearly and professionally</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Arrive punctually and properly equipped for assignments</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Submit accurate and timely match reports</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">5.2 Continuous Development</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Participate in ongoing training and certification programs</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Stay updated with rule changes and regulations</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Seek feedback and work on areas for improvement</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Mentor new officials and share knowledge</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Maintain physical fitness appropriate for officiating level</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card id="prohibited">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🚫</span>
                  6. Prohibited Conduct
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3">6.1 Zero Tolerance Behaviors</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Discrimination based on race, gender, religion, sexual orientation, or nationality</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Harassment, bullying, or intimidation of any form</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Violence or threats of violence against any person</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Use of abusive, offensive, or inappropriate language</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Match-fixing, betting, or any form of corruption</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Use of performance-enhancing drugs or banned substances</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">6.2 Serious Misconduct</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Deliberately injuring or attempting to injure opponents</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Bringing PCL into disrepute through public actions or statements</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Violation of contractual obligations or financial fraud</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Breach of confidentiality or misuse of sensitive information</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Repeated violations of PCL rules and regulations</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">6.3 Social Media and Public Conduct</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Posting offensive, defamatory, or inappropriate content</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Sharing confidential information about clubs, players, or PCL operations</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Engaging in online harassment or cyberbullying</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Promoting illegal activities or substances</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Misrepresenting PCL positions or making unauthorized statements</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card id="enforcement">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>⚖️</span>
                  7. Reporting and Enforcement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3">7.1 Reporting Violations</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>All members have a responsibility to report code violations</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Anonymous reporting options available for sensitive issues</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Protection for whistle-blowers against retaliation</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Prompt investigation of all reported incidents</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Regular updates to reporting parties on investigation progress</span></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">7.2 Disciplinary Actions</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-900 mb-3">Progressive Discipline Framework:</p>
                    <ul className="space-y-2">
                      <li className="flex gap-3 text-red-900"><span className="font-bold">•</span><span><strong>Warning:</strong> Formal written notice for minor violations</span></li>
                      <li className="flex gap-3 text-red-900"><span className="font-bold">•</span><span><strong>Suspension:</strong> Temporary exclusion from activities (1-6 months)</span></li>
                      <li className="flex gap-3 text-red-900"><span className="font-bold">•</span><span><strong>Fines:</strong> Financial penalties proportionate to violation severity</span></li>
                      <li className="flex gap-3 text-red-900"><span className="font-bold">•</span><span><strong>Expulsion:</strong> Permanent removal from PCL for serious misconduct</span></li>
                      <li className="flex gap-3 text-red-900"><span className="font-bold">•</span><span><strong>Legal Action:</strong> Criminal or civil proceedings for illegal activities</span></li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">7.3 Appeal Process</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Right to appeal disciplinary decisions within 30 days</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Independent review panel for appeal hearings</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Opportunity to present evidence and witnesses</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Final decisions binding on all parties</span></li>
                    <li className="flex gap-3"><span className="text-accent font-bold">•</span><span>Reinstatement procedures for successfully appealed cases</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card id="contact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📞</span>
                  8. Ethics and Compliance Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p className="mb-6">To report violations or seek guidance on ethical issues:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Ethics Email</p>
                      <p>ethics@professionalclubleague.com</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Confidential Report</p>
                      <p>report@professionalclubleague.com</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Phone</p>
                      <p>+91 6282829881</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Address</p>
                      <p>FDS COOP LLP</p>
                      <p>AKG Nagar, 18th Mile</p>
                      <p>Kanhangad, Kasaragod</p>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="font-semibold text-sm text-muted-foreground mb-2">Business Hours</p>
                    <p>Monday-Friday: 9:00 AM - 6:00 PM IST</p>
                    <p>Response time: 24-48 hours | Available 24/7 for emergencies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-center mt-16">
          <Button 
            variant="outline"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ Back to Top
          </Button>
        </div>
      </div>
    </div>
  )
}

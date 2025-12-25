'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Mail, Phone, MapPin } from 'lucide-react'

export default function TermsAndConditionsPage() {
  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms', icon: '✓' },
    { id: 'services', title: '2. Our Services', icon: '🛠️' },
    { id: 'responsibilities', title: '3. User Responsibilities', icon: '👤' },
    { id: 'payments', title: '4. Payments and Fees', icon: '💳' },
    { id: 'intellectual', title: '5. Intellectual Property', icon: '©️' },
    { id: 'liability', title: '6. Limitation of Liability', icon: '⚠️' },
    { id: 'termination', title: '7. Termination', icon: '🚫' },
    { id: 'contact', title: '8. Contact Us', icon: '📞' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-center gap-4 mb-6">
            <FileText className="w-10 h-10 text-foreground" />
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Terms and Conditions</h1>
          </div>
          <p className="text-lg sm:text-xl text-foreground max-w-2xl mb-8">
            Terms of use for the Professional Club League platform
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

      {/* Main Content with Sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
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

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8 text-foreground">
            {/* Acceptance */}
            <Card id="acceptance">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>✓</span>
                  1. Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-foreground">
                <p className="text-foreground">
                  By accessing and using the Professional Club League (PCL) platform, you agree to be bound by these 
                  Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.
                </p>
                <p className="text-foreground">
                  PCL is operated by FDS COOP LLP, a startup registered under DIPP with 
                  Startup ID: DIPP69878 and KSUM ID: DIPP69878/2020/KSUM1031.
                </p>
              </CardContent>
            </Card>

            {/* Services */}
            <Card id="services">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🛠️</span>
                  2. Our Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">2.1 Platform Services</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Player registration and profile management</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Club creation and team management</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Stadium booking and venue management</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Tournament organization and participation</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Referee and staff coordination</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Match scheduling and result tracking</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Player scouting and club recruitment</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-foreground">2.2 User Categories</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground"><strong>Players:</strong> Individual athletes participating in sports</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground"><strong>Club Owners:</strong> Organizations managing sports teams</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground"><strong>Stadium Owners:</strong> Venue providers for sports events</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground"><strong>Referees:</strong> Officials overseeing matches and tournaments</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground"><strong>Staff/Volunteers:</strong> Support personnel for events</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* User Responsibilities */}
            <Card id="responsibilities">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>👤</span>
                  3. User Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">3.1 Account Security</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Maintain confidentiality of your account credentials</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Notify us immediately of any unauthorized access</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Provide accurate and up-to-date information</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Complete KYC verification when required</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-foreground">3.2 Prohibited Activities</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Creating fake or duplicate accounts</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Sharing false or misleading information</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Engaging in harassment or discriminatory behavior</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Attempting to breach platform security</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Using the platform for illegal activities</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Interfering with other users' experience</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Payments and Fees */}
            <Card id="payments">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>💳</span>
                  4. Payments and Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">4.1 Service Fees</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Membership fees for premium features</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Tournament registration fees</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Stadium booking charges</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Processing fees for transactions</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-foreground">4.2 Payment Terms</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">All fees are payable in advance unless otherwise specified</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Payments are processed through secure third-party providers</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Refunds are subject to our Refund Policy</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-foreground">Failed payments may result in service suspension</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card id="intellectual">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>©️</span>
                  5. Intellectual Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">5.1 Platform Content</h4>
                  <p className="text-foreground">
                    All content, features, and functionality of the PCL platform, including but not limited to text, 
                    graphics, logos, icons, images, audio clips, and software, are owned by PCL and protected by 
                    copyright, trademark, and other intellectual property laws.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-foreground">5.2 User Content</h4>
                  <p className="text-foreground">
                    You retain ownership of content you submit to the platform but grant PCL a license to use, 
                    display, and distribute such content for platform operations and promotional purposes.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card id="liability">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>⚠️</span>
                  6. Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-foreground">
                <p className="text-foreground">
                  To the maximum extent permitted by law, PCL shall not be liable for any indirect, incidental, 
                  special, or consequential damages arising from your use of the platform, including but not limited to:
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-3">
                    <span className="text-accent font-bold">•</span>
                    <span className="text-foreground">Loss of profits or business opportunities</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent font-bold">•</span>
                    <span className="text-foreground">Data loss or corruption</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent font-bold">•</span>
                    <span className="text-foreground">Interruption of services</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent font-bold">•</span>
                    <span className="text-foreground">Third-party actions or content</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent font-bold">•</span>
                    <span className="text-foreground">Injuries occurring during sports activities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card id="termination">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🚫</span>
                  7. Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground">
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">7.1 Termination by You</h4>
                  <p className="text-foreground">You may terminate your account at any time by contacting our support team.</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-foreground">7.2 Termination by PCL</h4>
                  <p className="text-foreground">
                    We reserve the right to suspend or terminate your account if you violate these terms, 
                    engage in fraudulent activities, or for any other reason at our sole discretion.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card id="contact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📞</span>
                  8. Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p className="mb-6 text-foreground">For questions about these Terms and Conditions, contact us at:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Email</p>
                      <p className="text-foreground">support@professionalclubleague.com</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Phone</p>
                      <p className="text-foreground">+91 6282829881</p>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:col-span-2">
                    <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Address</p>
                      <p className="text-foreground">FDS COOP LLP</p>
                      <p className="text-foreground">AKG Nagar, 18th Mile</p>
                      <p className="text-foreground">Kanhangad, Kasaragod</p>
                      <p className="text-foreground">Kerala, India 671532</p>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:col-span-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-muted-foreground mb-2">Company & Identifiers</p>
                      <p className="text-sm text-foreground"><strong>Company:</strong> FDS COOP LLP</p>
                      <p className="text-sm text-foreground"><strong>Website:</strong> professionalclubleague.com</p>
                      <p className="text-sm text-foreground"><strong>Startup ID:</strong> DIPP69878</p>
                      <p className="text-sm text-foreground"><strong>KSUM ID:</strong> DIPP69878/2020/KSUM1031</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Back to Top Button */}
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
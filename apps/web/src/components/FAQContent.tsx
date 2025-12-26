'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { HelpCircle, Search, Mail, BookOpen, ArrowRight } from 'lucide-react'
import ContactModal from '@/components/ContactModal'

interface FAQ {
  q: string
  a: string
}

interface FAQCategory {
  category: string
  questions: FAQ[]
}

interface FAQContentProps {
  faqs: FAQCategory[]
}

export default function FAQContent({ faqs }: FAQContentProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <>
      {/* FAQ Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {faqs.map((category, idx) => (
            <div key={idx} className="scroll-mt-20">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
                <div className="w-2 h-10 bg-gradient-to-b from-[#1e3a8a] to-[#f97316] rounded-full" />
                <span className="text-[#1e3a8a]">{category.category}</span>
              </h2>

              <div className="space-y-4">
                {category.questions.map((faq, qIdx) => (
                  <details
                    key={qIdx}
                    className="group bg-card border-2 border-border rounded-xl overflow-hidden hover:border-[#f97316]/50 transition-all shadow-sm hover:shadow-md"
                  >
                    <summary className="cursor-pointer p-6 font-semibold text-lg text-foreground flex items-center justify-between gap-4 list-none">
                      <span className="flex-1">{faq.q}</span>
                      <HelpCircle className="w-5 h-5 text-[#f97316] flex-shrink-0 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-6 pt-2">
                      <p className="text-muted-foreground leading-relaxed text-base border-t border-border pt-4">
                        {faq.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-20 relative bg-gradient-to-br from-[#1e3a8a]/10 via-[#f97316]/10 to-background border-2 border-[#f97316]/30 rounded-3xl p-12 text-center overflow-hidden shadow-xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <Image
              src="/logo.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>

          <div className="relative">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-[#f97316]/10 rounded-full">
                <Mail className="w-12 h-12 text-[#f97316]" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-[#1e3a8a]">Still Have</span>{' '}
              <span className="text-[#f97316]">Questions?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our dedicated support team is ready to assist you with any questions about PCL.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#f97316] text-white rounded-xl font-semibold hover:bg-[#ea580c] transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Mail className="w-5 h-5" />
                Contact Support
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                href="/guide"
                className="inline-flex items-center gap-3 px-8 py-4 bg-card border-2 border-[#1e3a8a]/30 rounded-xl font-semibold hover:bg-[#1e3a8a]/5 hover:border-[#1e3a8a] transition-all"
              >
                <BookOpen className="w-5 h-5 text-[#1e3a8a]" />
                Getting Started Guide
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        defaultSubject="Question about PCL"
      />
    </>
  )
}

'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ContactSupportForm from '@/components/forms/ContactSupportForm'
import Image from 'next/image'
import { X } from 'lucide-react'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  defaultSubject?: string
}

export default function ContactModal({ isOpen, onClose, defaultSubject }: ContactModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="PCL Championship"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <DialogTitle className="text-3xl text-center">
            <span className="text-[#1e3a8a]">Contact</span>{' '}
            <span className="text-[#f97316]">Support</span>
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Have a question or need help? Fill out the form below and our team will get back to you within 24-48 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <ContactSupportForm onSuccess={onClose} defaultSubject={defaultSubject} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

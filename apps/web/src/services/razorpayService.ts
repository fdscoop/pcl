'use client'

import { Capacitor } from '@capacitor/core'

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrderData {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
  created_at: number
  payment_id: string // Our local payment record ID
}

export interface PaymentData {
  amount: number // Amount in paise (₹1 = 100 paise)
  currency: string // 'INR'
  receipt: string // Unique receipt ID
  description: string
  customer: {
    name: string
    email: string
    contact: string
  }
  notes?: Record<string, any>
}

export interface PaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

class RazorpayService {
  private keyId: string

  constructor() {
    this.keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
    
    console.log('=== RAZORPAY SERVICE INITIALIZATION (Web Mode) ===')
    console.log('Platform:', Capacitor.getPlatform())
    console.log('User Agent:', typeof window !== 'undefined' ? navigator.userAgent : 'server')
    
    if (!this.keyId) {
      throw new Error('Razorpay Key ID not found in environment variables')
    }
  }

  /**
   * Load Razorpay script dynamically for web
   */
  private async loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if already loaded
      if (window.Razorpay) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        console.log('Razorpay script loaded successfully')
        resolve(true)
      }
      script.onerror = (error) => {
        console.error('Failed to load Razorpay script:', error)
        resolve(false)
      }
      
      // For Capacitor webview, ensure script is added to head
      const target = document.head || document.getElementsByTagName('head')[0]
      target.appendChild(script)
    })
  }

  /**
   * Create order on backend
   */
  async createOrder(paymentData: PaymentData): Promise<RazorpayOrderData> {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const order = await response.json()
      return order
    } catch (error) {
      console.error('Error creating Razorpay order:', error)
      throw error
    }
  }

  /**
   * Verify payment signature on backend
   */
  async verifyPayment(paymentResponse: PaymentResponse): Promise<boolean> {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentResponse)
      })

      if (!response.ok) {
        throw new Error('Payment verification failed')
      }

      const result = await response.json()
      return result.verified === true
    } catch (error) {
      console.error('Error verifying payment:', error)
      throw error
    }
  }

  /**
   * Process payment for web platform and Capacitor webview
   */
  private async processWebPayment(
    order: RazorpayOrderData,
    customer: PaymentData['customer'],
    description: string,
    onSuccess: (response: PaymentResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      const scriptLoaded = await this.loadRazorpayScript()
      
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script. Please check your internet connection.')
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay is not available. Please try again.')
      }

      const options = {
        key: this.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Professional Club League',
        description: description,
        order_id: order.id,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.contact
        },
        theme: {
          color: '#f97316' // Orange theme to match PCL branding
        },
        handler: async (response: PaymentResponse) => {
          try {
            console.log('Payment response received:', response.razorpay_payment_id)
            // Verify payment on backend
            const verified = await this.verifyPayment(response)
            if (verified) {
              console.log('Payment verified successfully')
              onSuccess(response)
            } else {
              console.error('Payment verification failed')
              onError(new Error('Payment verification failed'))
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            onError(error)
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed by user')
            onError(new Error('Payment cancelled by user'))
          },
          // Enhanced options for Capacitor webview
          confirm_close: true,
          escape: true,
          animation: true,
          backdropclose: false
        },
        // Additional options for better Capacitor support
        retry: {
          enabled: true,
          max_count: 3
        },
        remember_customer: false,
        timeout: 300, // 5 minutes timeout
        readonly: {
          contact: false,
          email: false,
          name: false
        }
      }

      console.log('Opening Razorpay checkout with options:', {
        ...options,
        key: options.key.substring(0, 8) + '...' // Log partial key for debugging
      })

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Web payment error:', error)
      onError(error)
    }
  }

  /**
   * Main payment processing function - Uses web implementation for all platforms
   * This works perfectly in Capacitor webview when loading from remote URL
   */
  async processPayment(
    paymentData: PaymentData,
    onSuccess: (response: PaymentResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      // Create order first
      const order = await this.createOrder(paymentData)
      console.log('✅ Razorpay order created:', order.id)

      // Always use web implementation - works in all environments
      console.log('🌐 Using web Razorpay checkout (works in web & Capacitor)')
      await this.processWebPayment(
        order,
        paymentData.customer,
        paymentData.description,
        onSuccess,
        onError
      )
    } catch (error) {
      console.error('❌ Payment processing error:', error)
      onError(error)
    }
  }

  /**
   * Helper function to convert rupees to paise
   */
  static rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100)
  }

  /**
   * Helper function to convert paise to rupees
   */
  static paiseToRupees(paise: number): number {
    return paise / 100
  }

  /**
   * Generate unique receipt ID
   */
  static generateReceipt(prefix: string = 'PCL'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}_${timestamp}_${random}`
  }
}

export const razorpayService = new RazorpayService()
export { RazorpayService }
export default razorpayService
'use client'

import { Capacitor } from '@capacitor/core'

// Dynamic import for Capacitor Razorpay to handle different export structures
let RazorpayPlugin: any = null

async function loadRazorpayPlugin() {
  if (Capacitor.isNativePlatform() && !RazorpayPlugin) {
    try {
      const plugin = await import('capacitor-razorpay')
      RazorpayPlugin = plugin.Checkout || plugin.default || plugin
    } catch (error) {
      console.error('Failed to load Razorpay plugin:', error)
    }
  }
  return RazorpayPlugin
}

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
  private isNative: boolean

  constructor() {
    this.keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
    this.isNative = Capacitor.isNativePlatform()
    
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
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
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
   * Process payment for web platform
   */
  private async processWebPayment(
    order: RazorpayOrderData,
    customer: PaymentData['customer'],
    description: string,
    onSuccess: (response: PaymentResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    const scriptLoaded = await this.loadRazorpayScript()
    
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay script')
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
          // Verify payment on backend
          const verified = await this.verifyPayment(response)
          if (verified) {
            onSuccess(response)
          } else {
            onError(new Error('Payment verification failed'))
          }
        } catch (error) {
          onError(error)
        }
      },
      modal: {
        ondismiss: () => {
          onError(new Error('Payment cancelled by user'))
        }
      }
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }

  /**
   * Process payment for mobile platform using Capacitor
   */
  private async processMobilePayment(
    order: RazorpayOrderData,
    customer: PaymentData['customer'],
    description: string,
    onSuccess: (response: PaymentResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      const plugin = await loadRazorpayPlugin()
      
      if (!plugin) {
        throw new Error('Razorpay plugin not available on this platform')
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
        }
      }

      const result = await plugin.open(options)
      
      if (result && result.response) {
        // Verify payment on backend
        const verified = await this.verifyPayment(result.response)
        if (verified) {
          onSuccess(result.response)
        } else {
          onError(new Error('Payment verification failed'))
        }
      } else {
        onError(new Error('Payment cancelled or failed'))
      }
    } catch (error) {
      console.error('Mobile payment error:', error)
      onError(error)
    }
  }

  /**
   * Main payment processing function
   */
  async processPayment(
    paymentData: PaymentData,
    onSuccess: (response: PaymentResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      // Create order first
      const order = await this.createOrder(paymentData)

      // Process payment based on platform
      if (this.isNative) {
        await this.processMobilePayment(
          order,
          paymentData.customer,
          paymentData.description,
          onSuccess,
          onError
        )
      } else {
        await this.processWebPayment(
          order,
          paymentData.customer,
          paymentData.description,
          onSuccess,
          onError
        )
      }
    } catch (error) {
      console.error('Payment processing error:', error)
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
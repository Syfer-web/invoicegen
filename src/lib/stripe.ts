import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

let stripe: Stripe
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
  })
} catch {
  stripe = new Stripe('dummy', { apiVersion: '2026-04-22.dahlia' })
}

/**
 * Create a Stripe Payment Link for an invoice.
 * Returns the payment link URL.
 */
export async function createPaymentLink(params: {
  amount: number        // in cents
  currency: string       // 'eur' | 'gbp' | 'usd'
  invoiceNumber: string
  clientEmail: string
  description: string
}): Promise<string> {
  const { amount, currency, invoiceNumber, clientEmail, description } = params

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: `Invoice ${invoiceNumber}`,
            description,
          },
        },
        quantity: 1,
      },
    ],
    after_completion: {
      type: 'hosted_confirmation',
    },
    metadata: {
      invoice_number: invoiceNumber,
      client_email: clientEmail,
    },
  })

  return paymentLink.url!
}
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { amount, currency, invoiceNumber, clientEmail, description } = await request.json()

    // Check for Stripe key
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY to .env.local' },
        { status: 503 }
      )
    }

    // Dynamically import stripe to avoid crashing if key is missing
    const { createPaymentLink } = await import('@/lib/stripe')
    const paymentLinkUrl = await createPaymentLink({
      amount,
      currency,
      invoiceNumber,
      clientEmail,
      description,
    })

    return NextResponse.json({ paymentLinkUrl })
  } catch (error: any) {
    console.error('[create-payment-link]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
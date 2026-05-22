import { detectRegion, PRICING, CURRENCY } from '@/lib/pricing'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import SocialProof from '@/components/SocialProof'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Testimonials from '@/components/Testimonials'
import Integrations from '@/components/Integrations'
import ComparisonTable from '@/components/ComparisonTable'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'InvoiceGen — Professional Invoices in Seconds',
  description: 'Create, send and track invoices instantly. Automated reminders, Stripe payments, BTW correct. Free to start.',
}

export default async function Home() {
  const forwarded = process.env['X-Forwarded-For'] || ''
  const realIp = forwarded.split(',')[0].trim() || '127.0.0.1'
  const region = await detectRegion(realIp)
  const prices = PRICING[region]
  const { symbol } = CURRENCY[region]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Nav region={region} prices={prices} symbol={symbol} />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Integrations />
        <ComparisonTable />
        <Pricing region={region} prices={prices} symbol={symbol} />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
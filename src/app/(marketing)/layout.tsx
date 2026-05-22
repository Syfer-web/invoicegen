import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign up — InvoiceGen',
  description: 'Create your free InvoiceGen account. No credit card required.',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] px-6">
      <div className="mb-8">
        <a href="/" className="text-2xl font-bold tracking-tight text-white">
          Invoice<span className="text-emerald-400">Gen</span>
        </a>
      </div>
      {children}
    </div>
  )
}
import { NextRequest, NextResponse } from 'next/server'
import { getTemplateHTML } from '@/lib/invoice-html'

const HTMLPDF_API_KEY = process.env.HTMLPDF_API_KEY
const HTMLPDF_API_URL = 'https://api.htmlpdfapi.com/v1/pdf'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { templateId, invoice } = body

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice data required' }, { status: 400 })
    }

    const html = getTemplateHTML(templateId || 'modern', invoice)

    // If no API key, return HTML for print/download client-side
    if (!HTMLPDF_API_KEY) {
      return NextResponse.json({ html, message: 'HTML generated — PDF_API_KEY not set' })
    }

    const response = await fetch(HTMLPDF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HTMLPDF_API_KEY}`,
      },
      body: JSON.stringify({
        api_key: HTMLPDF_API_KEY,
        html,
        options: {
          paperSize: 'A4',
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          printBackground: true,
          landscape: false,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `PDF API error: ${err}` }, { status: 502 })
    }

    const buffer = await response.arrayBuffer()
    const filename = `${invoice.invoice_number || 'invoice'}.pdf`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'PDF generation failed' }, { status: 500 })
  }
}
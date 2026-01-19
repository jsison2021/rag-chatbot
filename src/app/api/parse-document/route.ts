import { NextRequest, NextResponse } from 'next/server'
import { extractText } from 'unpdf'

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  // Convert Buffer to Uint8Array for unpdf
  const uint8Array = new Uint8Array(pdfBuffer)
  const { text } = await extractText(uint8Array)
  return Array.isArray(text) ? text.join('\n\n') : text
}

export async function POST(request: NextRequest) {
  try {
    const { content, type, name } = await request.json()

    console.log('Parsing document:', name, 'type:', type, 'content length:', content?.length)

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    let extractedText = ''

    if (type === 'application/pdf') {
      // PDF parsing - content is base64 encoded
      // Remove data URL prefix if present
      const base64Data = content.replace(/^data:application\/pdf;base64,/, '')
      const pdfBuffer = Buffer.from(base64Data, 'base64')

      console.log('PDF buffer size:', pdfBuffer.length)

      try {
        extractedText = await extractTextFromPDF(pdfBuffer)
        console.log('Extracted text length:', extractedText.length)
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        return NextResponse.json({ error: 'Failed to parse PDF: ' + String(pdfError) }, { status: 400 })
      }
    } else {
      // For text files, content is already text
      extractedText = content
    }

    // Clean up the text for better formatting
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      // Remove HTML tags like <br>
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      // Remove markdown table formatting completely
      .replace(/\|[-:]+[-:|]+/g, '')  // Remove table separator rows like |---|---|
      .replace(/[-:]+\|[-:|]+/g, '')  // Remove variations
      .replace(/^\s*\|/gm, '')  // Remove leading pipes
      .replace(/\|\s*$/gm, '')  // Remove trailing pipes
      .replace(/\s*\|\s*/g, ' ')  // Replace middle pipes with spaces
      // Remove excessive whitespace but preserve intentional line breaks
      .replace(/[ \t]+/g, ' ')
      // Clean up bullet points and list markers
      .replace(/•/g, '\n• ')
      // Fix run-on sentences from PDF extraction (lowercaseUppercase pattern)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace from lines
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim()

    return NextResponse.json({
      text: extractedText,
      name,
      charCount: extractedText.length,
    })
  } catch (error) {
    console.error('Document parsing error:', error)
    return NextResponse.json({ error: 'Failed to process document: ' + String(error) }, { status: 500 })
  }
}

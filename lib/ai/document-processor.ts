// ============================================================
// Document Processor
// Extracts plain text from uploaded files (PDF, TXT, MD)
// ============================================================

export interface ExtractionResult {
  text: string
  pageCount?: number
}

/**
 * Extract plain text from a file buffer.
 * @param buffer - raw file bytes
 * @param fileType - 'pdf' | 'txt' | 'md'
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  const ext = fileType.toLowerCase().replace('.', '')

  switch (ext) {
    case 'pdf':
      return extractFromPDF(buffer)

    case 'txt':
    case 'md':
    case 'markdown':
      return buffer.toString('utf-8')

    default:
      throw new Error(
        `Unsupported file type: "${fileType}". Supported types: PDF, TXT, MD`
      )
  }
}

async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import avoids bundling issues with Next.js server components
    const pdfParse = (await import('pdf-parse')).default
    const result = await pdfParse(buffer, {
      // Disable test-file loading that causes issues in Next.js
      max: 0,
    })

    const text = result.text?.trim()

    if (!text || text.length < 50) {
      throw new Error(
        'This PDF appears to be scanned or image-based and contains no extractable text. ' +
        'Please use a text-based PDF.'
      )
    }

    return text
  } catch (err) {
    if (err instanceof Error && err.message.includes('scanned')) {
      throw err
    }
    throw new Error(
      `Failed to parse PDF: ${err instanceof Error ? err.message : 'Unknown error'}. ` +
      'Make sure the file is a valid, non-corrupted PDF.'
    )
  }
}

/**
 * Validate file size against plan limits.
 */
export function validateFileSize(
  sizeBytes: number,
  plan: 'free' | 'premium'
): { valid: boolean; message?: string } {
  const maxMB = plan === 'premium' ? 20 : 5
  const maxBytes = maxMB * 1024 * 1024

  if (sizeBytes > maxBytes) {
    return {
      valid: false,
      message: `File is too large (${(sizeBytes / 1024 / 1024).toFixed(1)} MB). ` +
        `Your ${plan} plan allows up to ${maxMB} MB per file.` +
        (plan === 'free' ? ' Upgrade to Premium for up to 20 MB.' : ''),
    }
  }

  if (sizeBytes === 0) {
    return { valid: false, message: 'File appears to be empty' }
  }

  return { valid: true }
}

/**
 * Clean extracted text: remove excessive whitespace, null bytes, etc.
 */
export function cleanText(text: string): string {
  return text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ') // Collapse horizontal whitespace
    .replace(/\n{4,}/g, '\n\n\n') // Max 3 consecutive newlines
    .trim()
}

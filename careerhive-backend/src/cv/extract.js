// Plain text from a CV file (PDF, Word .docx, or text). Nothing is written to disk.
import path from 'node:path'
import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'
import { fail } from '../http.js'

export const CV_TYPES = ['.pdf', '.docx', '.txt', '.md']

export async function cvText(buffer, fileName) {
  const ext = path.extname(fileName ?? '').toLowerCase()
  let text = ''
  if (ext === '.pdf' || buffer.subarray(0, 5).toString('latin1') === '%PDF-') {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      text = (await extractText(pdf, { mergePages: true })).text
    } catch { fail(400, 'That PDF could not be opened. Try exporting it again from Word or Google Docs.') }
  } else if (ext === '.docx') {
    try { text = (await mammoth.extractRawText({ buffer })).value } catch { fail(400, 'That Word file could not be read. Save it as .docx or PDF and try again.') }
  } else if (ext === '.txt' || ext === '.md') {
    text = buffer.toString('utf8')
  } else {
    fail(400, 'Upload your CV as a PDF, a Word (.docx) or a text file.')
  }
  text = String(text ?? '').replace(/\u0000/g, '').trim()
  if (text.split(/\s+/).length < 25) fail(422, 'We couldn’t find enough text in this file — if it’s a scanned image, export a text PDF or a .docx instead.')
  return text.slice(0, 60000) // a CV is short; this caps a pathological upload
}

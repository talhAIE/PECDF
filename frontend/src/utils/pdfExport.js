import jsPDF from 'jspdf'

const MARGIN = 18
const PAGE_W = 210
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_Y = PAGE_H - 8

function stripInlineMarkdown(s) {
  if (s == null) return ''
  return String(s)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
}

function isTableSeparator(line) {
  const t = line.trim()
  if (!t.includes('|')) return false
  const parts = t.split('|').map((p) => p.trim()).filter(Boolean)
  return parts.length > 0 && parts.every((p) => /^:?-+:?$/.test(p))
}

/**
 * Consumes consecutive GFM-style pipe table lines from `lines` starting at `startIdx`.
 */
function parseTableRows(lines, startIdx) {
  const rows = []
  let i = startIdx
  while (i < lines.length) {
    const t = lines[i].replace(/\r$/, '').trim()
    if (!t) break
    if (!t.includes('|')) break
    if (isTableSeparator(t)) {
      i++
      continue
    }

    let body = t
    if (body.startsWith('|')) body = body.slice(1)
    if (body.endsWith('|')) body = body.slice(0, -1)
    const cells = body.split('|').map((c) => stripInlineMarkdown(c.trim()))
    if (cells.length === 0) break
    rows.push(cells)
    i++
  }
  return { rows, endIndex: i }
}

function looksLikeTableStart(line) {
  const t = line.trim()
  // GFM pipe tables almost always start with '|' on each row
  return t.includes('|') && t.startsWith('|')
}

/** Letters-only uppercase ratio (0–1), for detecting ALL-CAPS section titles. */
function letterUpperRatio(s) {
  const letters = (s.match(/[a-zA-Z]/g) || []).length
  if (letters < 2) return 0
  const upper = (s.match(/[A-Z]/g) || []).length
  return upper / letters
}

/**
 * Plain-text section lines like "1. EXECUTIVE SUMMARY" (model often omits # headings).
 */
function isNumberedSectionHeading(line) {
  const t = stripInlineMarkdown(line).trim()
  const m = t.match(/^(\d+)\.\s+(.+)$/)
  if (!m) return false
  const rest = m[2].trim()
  if (rest.length < 4 || rest.length > 140) return false
  if (letterUpperRatio(rest) >= 0.62) return true
  const words = rest.split(/\s+/).filter(Boolean)
  return words.length <= 10 && words.length >= 1 && words.every((w) => /^[A-Z]/.test(w))
}

/**
 * Standalone title line e.g. "EXPORT OUTLOOK REPORT" (not a bullet or table).
 */
function isStandaloneAllCapsTitleLine(line) {
  const t = stripInlineMarkdown(line).trim()
  if (t.length < 8 || t.length > 100) return false
  if (/^#{1,6}\s/.test(t)) return false
  if (/^[-*]\s/.test(t)) return false
  if (/^\d+\.\s/.test(t)) return false
  if (t.includes('|')) return false
  if (letterUpperRatio(t) < 0.88) return false
  const words = t.split(/\s+/).length
  return words >= 2 && words <= 14
}

function renderTable(doc, rows, y0, ensureSpace, renderLineHeight) {
  let y = y0
  if (!rows.length) return y

  const numCols = Math.max(...rows.map((r) => r.length), 1)
  const colW = CONTENT_W / numCols
  const lh = renderLineHeight ?? 3.6

  rows.forEach((row, rowIdx) => {
    const padded = [...row]
    while (padded.length < numCols) padded.push('')
    const isHeader = rowIdx === 0

    const wrappedCells = padded.map((cell) => {
      doc.setFontSize(8)
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal')
      const text = stripInlineMarkdown(cell)
      return doc.splitTextToSize(text, colW - 2)
    })
    const maxLines = Math.max(...wrappedCells.map((w) => w.length), 1)
    const rowH = maxLines * lh + 2.5

    ensureSpace(rowH + 3)
    let x = MARGIN
    wrappedCells.forEach((lines) => {
      doc.setFontSize(8)
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal')
      doc.setTextColor(isHeader ? 30 : 51, isHeader ? 41 : 65, isHeader ? 59 : 85)
      doc.text(lines, x + 1, y + lh)
      x += colW
    })
    y += rowH
    if (isHeader && rows.length > 1) {
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.25)
      doc.line(MARGIN, y - 1, MARGIN + CONTENT_W, y - 1)
    }
  })

  doc.setTextColor(51, 65, 85)
  doc.setFont('helvetica', 'normal')
  return y
}

function addFooter(doc, pageNum, totalPages) {
  doc.setPage(pageNum)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(
    `PECDF — Pakistan Export Demand Forecasting System  |  Page ${pageNum} of ${totalPages}`,
    PAGE_W / 2,
    FOOTER_Y,
    { align: 'center' }
  )
}

export function downloadReportAsPDF(reportData) {
  const { report_text, scope, horizon, tone, macro, generated_at, report_id } = reportData

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = 0

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, PAGE_W, 40, 'F')

  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('PECDF Export Outlook Report', MARGIN, 16)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(
    `Scope: ${String(scope).toUpperCase()}  ·  Horizon: ${horizon} month${horizon > 1 ? 's' : ''}  ·  Tone: ${tone}`,
    MARGIN,
    25
  )
  doc.text(
    `Generated: ${new Date(generated_at).toLocaleString()}  ·  Report ID: ${report_id}`,
    MARGIN,
    32
  )

  y = 48

  doc.setFillColor(241, 245, 249)
  doc.rect(MARGIN, y, CONTENT_W, 11, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('MACRO ASSUMPTIONS', MARGIN + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `USD/PKR: ${macro.usd_pkr}  |  Brent Oil: $${macro.brent_oil}/bbl  |  US Confidence: ${macro.us_confidence}`,
    MARGIN + 3,
    y + 8.5
  )

  y += 18

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_H - 14) {
      doc.addPage()
      y = MARGIN
    }
  }

  /** Line height factor tuned for Helvetica readability */
  const lineFactor = 0.46

  const renderText = (text, fontSize, bold, color, indent = 0) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, CONTENT_W - indent)
    ensureSpace(lines.length * fontSize * lineFactor + 2)
    doc.text(lines, MARGIN + indent, y)
    y += lines.length * fontSize * lineFactor
  }

  const text = String(report_text ?? '').replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  let i = 0
  const lh = 3.6

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.replace(/\r$/, '').trim()

    if (!line) {
      y += 3.5
      i++
      continue
    }

    if (looksLikeTableStart(raw)) {
      const { rows, endIndex } = parseTableRows(lines, i)
      if (rows.length > 0) {
        y += 2
        y = renderTable(doc, rows, y, ensureSpace, lh)
        y += 2
        i = endIndex
        continue
      }
    }

    if (line.startsWith('# ')) {
      ensureSpace(14)
      y += 4
      renderText(stripInlineMarkdown(line.slice(2)), 13.5, true, [15, 23, 42])
      doc.setDrawColor(59, 130, 246)
      doc.setLineWidth(0.4)
      doc.line(MARGIN, y + 1, MARGIN + CONTENT_W, y + 1)
      y += 6
      i++
      continue
    }

    if (line.startsWith('## ')) {
      ensureSpace(12)
      y += 5
      renderText(stripInlineMarkdown(line.slice(3)), 11.5, true, [30, 41, 59])
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, y + 0.8, MARGIN + CONTENT_W, y + 0.8)
      y += 4
      i++
      continue
    }

    if (line.startsWith('### ')) {
      ensureSpace(10)
      y += 3
      renderText(stripInlineMarkdown(line.slice(4)), 10.5, true, [15, 23, 42])
      y += 3
      i++
      continue
    }

    if (line.startsWith('#### ')) {
      ensureSpace(9)
      y += 2.5
      renderText(stripInlineMarkdown(line.slice(5)), 10, true, [15, 23, 42])
      y += 2.5
      i++
      continue
    }

    if (line.startsWith('##### ')) {
      ensureSpace(8)
      y += 2
      renderText(stripInlineMarkdown(line.slice(6)), 9.5, true, [30, 41, 59])
      y += 2
      i++
      continue
    }

    if (line.startsWith('###### ')) {
      ensureSpace(7)
      y += 1.5
      renderText(stripInlineMarkdown(line.slice(7)), 9, true, [51, 65, 85])
      y += 2
      i++
      continue
    }

    if (isStandaloneAllCapsTitleLine(line)) {
      ensureSpace(12)
      y += 3
      renderText(stripInlineMarkdown(line), 12, true, [15, 23, 42])
      y += 4
      i++
      continue
    }

    if (isNumberedSectionHeading(line)) {
      ensureSpace(12)
      y += 4
      renderText(stripInlineMarkdown(line), 10.5, true, [15, 23, 42])
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.25)
      doc.line(MARGIN, y + 0.8, MARGIN + CONTENT_W, y + 0.8)
      y += 3.5
      i++
      continue
    }

    if (/^[-*] /.test(line)) {
      const textBullet = '•  ' + stripInlineMarkdown(line.slice(2))
      renderText(textBullet, 9, false, [51, 65, 85], 3)
      y += 1.5
      i++
      continue
    }

    if (/^\d+\. /.test(line)) {
      renderText(stripInlineMarkdown(line), 9, false, [51, 65, 85], 3)
      y += 1.5
      i++
      continue
    }

    if (/^---+$/.test(line)) {
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, y, MARGIN + CONTENT_W, y)
      y += 4
      i++
      continue
    }

    renderText(stripInlineMarkdown(line), 9, false, [51, 65, 85])
    y += 2
    i++
  }

  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) addFooter(doc, p, totalPages)

  const filename = `PECDF_Report_${scope}_${horizon}m_${report_id}.pdf`
  doc.save(filename)
}

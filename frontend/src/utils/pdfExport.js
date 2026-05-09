import jsPDF from 'jspdf'

const MARGIN = 18
const PAGE_W = 210  // A4 mm
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_Y = PAGE_H - 8

function addFooter(doc, pageNum, totalPages) {
  doc.setPage(pageNum)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(
    `PECDF — Pakistan Export Demand Forecasting System  |  Page ${pageNum} of ${totalPages}`,
    PAGE_W / 2, FOOTER_Y, { align: 'center' }
  )
}

export function downloadReportAsPDF(reportData) {
  const { report_text, scope, horizon, tone, macro, generated_at, report_id } = reportData

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = 0

  // ── Cover header ─────────────────────────────────────────────────────────
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
    `Scope: ${scope.toUpperCase()}  ·  Horizon: ${horizon} month${horizon > 1 ? 's' : ''}  ·  Tone: ${tone}`,
    MARGIN, 25
  )
  doc.text(
    `Generated: ${new Date(generated_at).toLocaleString()}  ·  Report ID: ${report_id}`,
    MARGIN, 32
  )

  y = 48

  // ── Macro context bar ─────────────────────────────────────────────────────
  doc.setFillColor(241, 245, 249)
  doc.rect(MARGIN, y, CONTENT_W, 11, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('MACRO ASSUMPTIONS', MARGIN + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `USD/PKR: ${macro.usd_pkr}  |  Brent Oil: $${macro.brent_oil}/bbl  |  US Confidence: ${macro.us_confidence}`,
    MARGIN + 3, y + 8.5
  )

  y += 18

  // ── Markdown → PDF renderer ───────────────────────────────────────────────
  const ensureSpace = (needed) => {
    if (y + needed > PAGE_H - 14) {
      doc.addPage()
      y = MARGIN
    }
  }

  const renderText = (text, fontSize, bold, color, indent = 0) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, CONTENT_W - indent)
    ensureSpace(lines.length * fontSize * 0.42 + 2)
    doc.text(lines, MARGIN + indent, y)
    y += lines.length * fontSize * 0.42
  }

  const lines = report_text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()

    if (!line) {
      y += 2.5
      continue
    }

    // H1 (#)
    if (line.startsWith('# ')) {
      ensureSpace(12)
      y += 3
      renderText(line.slice(2), 13, true, [15, 23, 42])
      doc.setDrawColor(59, 130, 246)
      doc.setLineWidth(0.4)
      doc.line(MARGIN, y + 1, MARGIN + CONTENT_W, y + 1)
      y += 5
      continue
    }

    // H2 (##)
    if (line.startsWith('## ')) {
      ensureSpace(10)
      y += 4
      renderText(line.slice(3), 11.5, true, [30, 64, 175])
      y += 2
      continue
    }

    // H3 (###)
    if (line.startsWith('### ')) {
      ensureSpace(8)
      y += 2
      renderText(line.slice(4), 10, true, [71, 85, 105])
      y += 1
      continue
    }

    // Bullet (- or *)
    if (/^[-*] /.test(line)) {
      const text = '•  ' + line.slice(2).replace(/\*\*/g, '')
      renderText(text, 9, false, [51, 65, 85], 3)
      y += 1
      continue
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const text = line.replace(/\*\*/g, '')
      renderText(text, 9, false, [51, 65, 85], 3)
      y += 1
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line)) {
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, y, MARGIN + CONTENT_W, y)
      y += 4
      continue
    }

    // Normal paragraph (strip ** bold markers for simplicity)
    const cleaned = line.replace(/\*\*/g, '').replace(/\*/g, '')
    renderText(cleaned, 9, false, [51, 65, 85])
    y += 1.5
  }

  // ── Footer on every page ─────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) addFooter(doc, p, totalPages)

  const filename = `PECDF_Report_${scope}_${horizon}m_${report_id}.pdf`
  doc.save(filename)
}

export interface ExportColumn<T> {
  header: string
  accessor: (row: T) => string | number
  align?: "left" | "right" | "center"
}

interface ExportOptions<T> {
  filename: string
  sheetTitle?: string
  columns: ExportColumn<T>[]
  rows: T[]
  totalsRow?: Record<string, string | number>
}

export async function exportToExcel<T>({
  filename,
  sheetTitle = "Report",
  columns,
  rows,
  totalsRow,
}: ExportOptions<T>) {
  const XLSX = await import("xlsx")
  const data = [
    columns.map((c) => c.header),
    ...rows.map((row) => columns.map((c) => c.accessor(row))),
  ]
  if (totalsRow) {
    data.push(columns.map((c) => totalsRow[c.header] ?? ""))
  }
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(c.header.length, 12) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31))
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function exportToPDF<T>({
  filename,
  sheetTitle = "Report",
  columns,
  rows,
  totalsRow,
}: ExportOptions<T>) {
  const jsPDFModule = await import("jspdf")
  const autoTableModule = await import("jspdf-autotable")
  const jsPDF = jsPDFModule.default
  const autoTable = autoTableModule.default
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(sheetTitle, 40, 40)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120)
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-GB")} · ${rows.length} record${rows.length === 1 ? "" : "s"}`,
    40,
    56,
  )
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 72,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(c.accessor(row) ?? ""))),
    foot: totalsRow ? [columns.map((c) => String(totalsRow[c.header] ?? ""))] : undefined,
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [30, 30, 30],
      fontStyle: "bold",
    },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, { halign: c.align ?? "left", cellWidth: "auto" }]),
    ),
    margin: { left: 40, right: 40 },
    tableWidth: pageWidth - 80,
  })

  doc.save(`${filename}.pdf`)
}

export function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

export function toCsv(header: string[], rows: unknown[][]) {
  return [header.map(csvCell).join(";"), ...rows.map((r) => r.map(csvCell).join(";"))].join(
    "\n"
  )
}

export function csvResponse(filename: string, csv: string) {
  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

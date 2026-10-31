/** CSV helpers used by every export action in the demo. */

export type CsvValue = string | number | boolean | null | undefined;

export function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: Record<string, CsvValue>[], columns?: string[]): string {
  if (!rows.length) return "";
  const headers = columns ?? Object.keys(rows[0]);
  const headerLine = headers.map((header) => escapeCsvValue(header)).join(",");
  const body = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(","),
  );
  return [headerLine, ...body].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, CsvValue>[], columns?: string[]) {
  if (typeof window === "undefined") return;
  const csv = toCsv(rows, columns);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// `;` delimiter, not `,` — matches the workspace's existing students.csv and
// what es-AR locale Excel expects by default (it treats `,` as the decimal
// separator, so comma-delimited CSVs open as one column there).
const DELIMITER = ";";

function escapeField(field: string): string {
  if (field.includes(DELIMITER) || field.includes('"') || field.includes("\n") || field.includes("\r")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(DELIMITER));
  return lines.join("\r\n");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

// Prepends a UTF-8 BOM so Excel (the primary consumer here) renders accented
// characters correctly instead of guessing the wrong encoding.
export const downloadCsv = (filename: string, csv: string) =>
  downloadBlob(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    filename,
  );

// Lowercase and strip diacritics (NFD-normalize, drop combining marks), for
// accent-insensitive search and ASCII-safe filenames.
export const fold = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function slugify(text: string): string {
  return fold(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

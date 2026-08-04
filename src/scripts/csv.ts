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

// Prepends a UTF-8 BOM so Excel (the primary consumer here) renders accented
// characters correctly instead of guessing the wrong encoding.
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

// NFD-normalize and strip diacritics (same technique as studentsPage.ts's
// search filter) so filenames stay ASCII-safe across platforms.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

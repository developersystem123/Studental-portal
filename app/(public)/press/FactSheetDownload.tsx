"use client";

import { Button } from "@/components/ui";
import Icon from "@/components/icons";

type Fact = { label: string; value: string };

/**
 * Builds a minimal, valid single-page PDF from plain text — no external library.
 * Everything written is ASCII (non-ASCII is stripped to "-") so that JS string
 * length equals the UTF-8 byte length, which keeps the xref byte offsets correct.
 */
function buildFactSheetPdf(rows: Fact[]): Blob {
  const esc = (s: string) =>
    s
      .replace(/[^\x20-\x7E]/g, "-") // keep ASCII-only so offsets stay byte-accurate
      .replace(/[\\()]/g, (m) => "\\" + m); // escape PDF string specials

  const content: string[] = [];
  content.push("BT");
  content.push("0 0 0 rg");
  content.push("/F1 22 Tf");
  content.push("60 772 Td");
  content.push(`(${esc("EduPortal - Company Fact Sheet")}) Tj`);
  content.push("/F1 13 Tf");
  content.push("0 -34 Td");
  content.push(`(${esc("Quick facts")}) Tj`);
  content.push("/F1 11 Tf");
  for (const r of rows) {
    content.push("0 -26 Td");
    content.push(`(${esc(`${r.label}:   ${r.value}`)}) Tj`);
  }
  content.push("/F1 9 Tf");
  content.push("0 -40 Td");
  content.push(`(${esc("Generated from eduportal.app/press")}) Tj`);
  content.push("ET");
  const stream = content.join("\n");

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  const size = objects.length + 1;
  pdf += `xref\n0 ${size}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function FactSheetDownload({ facts }: { facts: Fact[] }) {
  function handleDownload() {
    const blob = buildFactSheetPdf(facts);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eduportal-fact-sheet.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" type="button" onClick={handleDownload}>
      <Icon.Download size={14} /> Download PDF
    </Button>
  );
}

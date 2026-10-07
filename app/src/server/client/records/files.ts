import "server-only";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Preview placeholder for files with nothing stored (seeded samples): hatch, caption, ADITUS line. */
export function placeholderSvg(title: string, kind: string, w = 800, h = 600) {
  const words = title.toUpperCase().split(" ");
  const lines: string[] = [];
  for (const wd of words) {
    const last = lines[lines.length - 1];
    if (last && (last + " " + wd).length <= 26) lines[lines.length - 1] = last + " " + wd;
    else lines.push(wd);
  }
  const y0 = h / 2 - (lines.length - 1) * 14;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><pattern id="h" width="15" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="15" height="15" fill="#F7F8FA"/><rect x="14" width="1" height="15" fill="rgba(16,24,40,.035)"/></pattern></defs>
<rect width="100%" height="100%" fill="url(#h)"/>
<text x="${w / 2}" y="${y0 - 34}" text-anchor="middle" font-family="Space Mono, monospace" font-size="14" fill="#667085">${esc(kind.toUpperCase())}</text>
${lines.map((l, i) => `<text x="${w / 2}" y="${y0 + i * 28}" text-anchor="middle" font-family="Space Mono, monospace" font-size="20" font-weight="700" fill="#101828">${esc(l)}</text>`).join("\n")}
<text x="${w / 2}" y="${h - 32}" text-anchor="middle" font-family="Space Mono, monospace" font-size="12" fill="#98A2B3">ADITUS · SAMPLE FILE · NOTHING STORED</text>
</svg>`;
}

/** Minimal one page PDF (Courier, WinAnsi) so downloads of seeded samples open in any viewer. */
export function placeholderPdf(lines: string[]) {
  const enc = (s: string) =>
    s
      .replace(/₹/g, "Rs ")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[→]/g, "->")
      .replace(/[^\x20-\xFF]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  const text = ["BT", "/F1 11 Tf", "56 780 Td", "15 TL", ...lines.flatMap((l, i) => [i === 0 ? "/F1 16 Tf" : i === 1 ? "/F1 11 Tf" : "", `(${enc(l)}) Tj T*`].filter(Boolean)), "ET"].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(text, "latin1")} >>\nstream\n${text}\nendstream`,
  ];
  let out = "%PDF-1.4\n";
  const offs: number[] = [];
  objs.forEach((o, i) => {
    offs.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

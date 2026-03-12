function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

type MenuDishPdf = {
  dishName: string;
  description: string;
  ingredients: string;
  platingNotes: string | null;
  imageUrl: string | null;
};

type MenuPdfPayload = {
  title: string;
  mealType: string;
  courses: number;
  dishes: MenuDishPdf[];
};

export function buildMichelinMenuPdf(payload: MenuPdfPayload): Buffer {
  const lines: Array<{ text: string; size?: number; centered?: boolean }> = [];

  lines.push({ text: payload.title, size: 26, centered: true });
  lines.push({ text: "", size: 10 });
  lines.push({ text: `${payload.mealType} · ${payload.courses} courses`, size: 12, centered: true });
  lines.push({ text: "", size: 10 });

  payload.dishes.forEach((dish, index) => {
    lines.push({ text: dish.dishName.toUpperCase(), size: 18, centered: true });
    lines.push({ text: dish.description, size: 11, centered: true });
    lines.push({ text: `Ingredients: ${dish.ingredients}`, size: 10 });
    if (dish.platingNotes) lines.push({ text: `Plating: ${dish.platingNotes}`, size: 10 });
    if (dish.imageUrl) lines.push({ text: `Image: ${dish.imageUrl}`, size: 9 });
    if (index < payload.dishes.length - 1) lines.push({ text: "", size: 10 });
  });

  const content: string[] = ["BT", "/F1 12 Tf", "50 790 Td"];
  let currentY = 790;

  for (const line of lines) {
    const fontSize = line.size ?? 11;
    const escaped = escapePdfText(line.text);
    const nextY = currentY - Math.max(fontSize + 6, 14);
    const y = Math.max(nextY, 60);
    currentY = y;

    const x = line.centered
      ? Math.max(50, 300 - (line.text.length * (fontSize * 0.25)))
      : 50;

    content.push(`/${"F1"} ${fontSize} Tf`);
    content.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    content.push(`(${escaped}) Tj`);
    content.push(`${-x.toFixed(2)} ${-y.toFixed(2)} Td`);
  }

  content.push("ET");
  const contentStream = content.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(contentStream, "utf8")} >> stream\n${contentStream}\nendstream endobj`,
  ];

  const header = "%PDF-1.4\n";
  let body = "";
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(header + body, "utf8"));
    body += `${obj}\n`;
  }

  const xrefStart = Buffer.byteLength(header + body, "utf8");
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];
  for (let i = 1; i <= objects.length; i += 1) {
    xref.push(`${offsets[i].toString().padStart(10, "0")} 00000 n `);
  }

  const trailer = [
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    `${xrefStart}`,
    "%%EOF",
  ].join("\n");

  return Buffer.from(`${header}${body}${xref.join("\n")}\n${trailer}`);
}

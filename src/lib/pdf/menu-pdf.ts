import fs from "node:fs";
import PDFDocument from "pdfkit";
import type { Locale } from "@/lib/i18n/config";

type MenuDishPdf = {
  courseLabel: string | null;
  dishName: string;
  description: string;
  ingredients: string;
  platingNotes: string | null;
  decorationNotes: string | null;
  imageUrl: string | null;
};

type MenuPdfPayload = {
  locale: Locale;
  title: string;
  mealType: string | null;
  serviceDateTime?: string | null;
  concept?: string | null;
  restrictionsLine?: string | null;
  courses: number;
  labels: {
    eyebrow: string;
    service: string;
    restrictions: string;
    ingredients: string;
    plating: string;
    finishing: string;
    noDishes: string;
    course: string;
    courseCount: string;
  };
  dishes: MenuDishPdf[];
};

type FontNames = {
  body: string;
  display: string;
};

const colors = {
  paper: "#f5efe6",
  ink: "#221a12",
  muted: "#7d6b57",
  accent: "#9f7a42",
  border: "#d8c7b2",
  panel: "#fbf7f1",
};

function resolveFirstExisting(paths: string[]) {
  return paths.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function resolveFonts(locale: Locale) {
  if (locale === "zh") {
    const body =
      resolveFirstExisting([
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
        "/usr/share/fonts/truetype/unifont/unifont_csur.ttf",
      ]) ?? "Helvetica";

    return { body, display: body };
  }

  if (locale === "hi") {
    const body =
      resolveFirstExisting([
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
      ]) ?? "Helvetica";

    return { body, display: body };
  }

  if (locale === "ar") {
    const body =
      resolveFirstExisting([
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
      ]) ?? "Helvetica";

    return { body, display: body };
  }

  return {
    body:
      resolveFirstExisting([
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
      ]) ?? "Helvetica",
    display:
      resolveFirstExisting([
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
      ]) ?? "Times-Bold",
  };
}

function registerFonts(doc: PDFKit.PDFDocument, locale: Locale): FontNames {
  const fonts = resolveFonts(locale);
  const body = fonts.body.startsWith("/") ? "CuisineBody" : fonts.body;
  const display = fonts.display.startsWith("/") ? "CuisineDisplay" : fonts.display;

  if (fonts.body.startsWith("/")) {
    doc.registerFont(body, fonts.body);
  }

  if (fonts.display.startsWith("/")) {
    doc.registerFont(display, fonts.display);
  }

  return { body, display };
}

function paintPageBackground(doc: PDFKit.PDFDocument) {
  const width = doc.page.width;
  const height = doc.page.height;

  doc.rect(0, 0, width, height).fill(colors.paper);
  doc.save();
  doc.strokeColor(colors.border).lineWidth(1.2);
  doc.roundedRect(26, 26, width - 52, height - 52, 24).stroke();
  doc.restore();
}

function drawDivider(doc: PDFKit.PDFDocument, y: number) {
  doc.save();
  doc.strokeColor(colors.border).lineWidth(1);
  doc.moveTo(84, y).lineTo(doc.page.width - 84, y).stroke();
  doc.restore();
}

function renderHeader(doc: PDFKit.PDFDocument, payload: MenuPdfPayload, fonts: FontNames) {
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const subtitleParts = [
    payload.mealType,
    payload.serviceDateTime ? `${payload.labels.service}: ${payload.serviceDateTime}` : null,
    `${payload.labels.courseCount}: ${payload.courses}`,
  ].filter(Boolean);

  doc.fillColor(colors.accent).font(fonts.body).fontSize(10);
  doc.text(payload.labels.eyebrow.toUpperCase(), doc.page.margins.left, 72, {
    width,
    align: "center",
    characterSpacing: 2.2,
  });

  doc.moveDown(1.2);
  doc.fillColor(colors.ink).font(fonts.display).fontSize(28);
  doc.text(payload.title, doc.page.margins.left, doc.y, { width, align: "center" });

  if (subtitleParts.length) {
    doc.moveDown(0.7);
    doc.fillColor(colors.muted).font(fonts.body).fontSize(11);
    doc.text(subtitleParts.join("   |   "), doc.page.margins.left + 28, doc.y, {
      width: width - 56,
      align: "center",
    });
  }

  if (payload.concept) {
    doc.moveDown(0.8);
    doc.fillColor(colors.ink).font(fonts.body).fontSize(11);
    doc.text(payload.concept, doc.page.margins.left + 36, doc.y, {
      width: width - 72,
      align: "center",
      lineGap: 2,
    });
  }

  if (payload.restrictionsLine) {
    doc.moveDown(0.8);
    doc.fillColor(colors.muted).font(fonts.body).fontSize(10.5);
    doc.text(`${payload.labels.restrictions}: ${payload.restrictionsLine}`, doc.page.margins.left + 36, doc.y, {
      width: width - 72,
      align: "center",
      lineGap: 2,
    });
  }

  doc.moveDown(1.2);
  drawDivider(doc, doc.y);
  doc.moveDown(1.6);
}

function buildNoteSections(payload: MenuPdfPayload, dish: MenuDishPdf) {
  return [
    { heading: payload.labels.ingredients, body: dish.ingredients },
    ...(dish.platingNotes ? [{ heading: payload.labels.plating, body: dish.platingNotes }] : []),
    ...(dish.decorationNotes ? [{ heading: payload.labels.finishing, body: dish.decorationNotes }] : []),
  ];
}

function measureDishSectionHeight(doc: PDFKit.PDFDocument, payload: MenuPdfPayload, dish: MenuDishPdf, fonts: FontNames) {
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const noteWidth = contentWidth - 76;
  const noteSections = buildNoteSections(payload, dish);

  let total = 18;

  doc.font(fonts.body).fontSize(10);
  total += doc.heightOfString(dish.courseLabel ?? "", { width: contentWidth, align: "center" });

  doc.font(fonts.display).fontSize(21);
  total += 10 + doc.heightOfString(dish.dishName, { width: contentWidth - 36, align: "center" });

  doc.font(fonts.body).fontSize(11);
  total += 10 + doc.heightOfString(dish.description, { width: contentWidth - 36, align: "center", lineGap: 2 });
  total += 22;

  for (const section of noteSections) {
    doc.font(fonts.body).fontSize(9.5);
    total += doc.heightOfString(section.heading.toUpperCase(), { width: noteWidth, characterSpacing: 1.2 });
    doc.font(fonts.body).fontSize(10.5);
    total += 2 + doc.heightOfString(section.body, { width: noteWidth, lineGap: 2 }) + 10;
  }

  return total + 34;
}

function ensureSpace(doc: PDFKit.PDFDocument, heightNeeded: number, payload: MenuPdfPayload, fonts: FontNames) {
  const available = doc.page.height - doc.page.margins.bottom - doc.y;
  if (available >= heightNeeded) {
    return;
  }

  doc.addPage();
  renderHeader(doc, payload, fonts);
}

function renderDishSection(
  doc: PDFKit.PDFDocument,
  payload: MenuPdfPayload,
  dish: MenuDishPdf,
  index: number,
  fonts: FontNames,
) {
  ensureSpace(doc, measureDishSectionHeight(doc, payload, dish, fonts), payload, fonts);

  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const panelX = doc.page.margins.left + 20;
  const panelWidth = width - 40;
  const noteSections = buildNoteSections(payload, dish);

  doc.fillColor(colors.accent).font(fonts.body).fontSize(10);
  doc.text((dish.courseLabel ?? `${payload.labels.course} ${index + 1}`).toUpperCase(), doc.page.margins.left, doc.y, {
    width,
    align: "center",
    characterSpacing: 1.8,
  });

  doc.moveDown(0.5);
  doc.fillColor(colors.ink).font(fonts.display).fontSize(21);
  doc.text(dish.dishName, doc.page.margins.left + 18, doc.y, {
    width: width - 36,
    align: "center",
  });

  doc.moveDown(0.4);
  doc.fillColor(colors.muted).font(fonts.body).fontSize(11);
  doc.text(dish.description, doc.page.margins.left + 18, doc.y, {
    width: width - 36,
    align: "center",
    lineGap: 2,
  });

  doc.moveDown(1);

  const contentStartY = doc.y;
  let currentY = contentStartY + 16;

  for (const section of noteSections) {
    doc.fillColor(colors.accent).font(fonts.body).fontSize(9.5);
    doc.text(section.heading.toUpperCase(), panelX + 18, currentY, {
      width: panelWidth - 36,
      align: "left",
      characterSpacing: 1.2,
    });
    currentY = doc.y + 2;

    doc.fillColor(colors.ink).font(fonts.body).fontSize(10.5);
    doc.text(section.body, panelX + 18, currentY, {
      width: panelWidth - 36,
      align: "left",
      lineGap: 2,
    });
    currentY = doc.y + 10;
  }

  const panelHeight = Math.max(currentY - contentStartY + 10, 84);

  doc.save();
  doc.fillColor(colors.panel).roundedRect(panelX, contentStartY, panelWidth, panelHeight, 18).fill();
  doc.strokeColor(colors.border).lineWidth(0.8).roundedRect(panelX, contentStartY, panelWidth, panelHeight, 18).stroke();
  doc.restore();

  currentY = contentStartY + 16;
  for (const section of noteSections) {
    doc.fillColor(colors.accent).font(fonts.body).fontSize(9.5);
    doc.text(section.heading.toUpperCase(), panelX + 18, currentY, {
      width: panelWidth - 36,
      align: "left",
      characterSpacing: 1.2,
    });
    currentY = doc.y + 2;

    doc.fillColor(colors.ink).font(fonts.body).fontSize(10.5);
    doc.text(section.body, panelX + 18, currentY, {
      width: panelWidth - 36,
      align: "left",
      lineGap: 2,
    });
    currentY = doc.y + 10;
  }

  doc.y = contentStartY + panelHeight + 22;
  if (index < payload.dishes.length - 1) {
    drawDivider(doc, doc.y - 4);
    doc.moveDown(1.2);
  }
}

export async function buildMichelinMenuPdf(payload: MenuPdfPayload): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, bottom: 60, left: 56, right: 56 },
    compress: true,
    info: {
      Title: payload.title,
      Author: "Cuisine",
      Subject: "Michelin-style menu export",
    },
  });

  const fonts = registerFonts(doc, payload.locale);
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  doc.on("pageAdded", () => {
    paintPageBackground(doc);
  });

  paintPageBackground(doc);
  renderHeader(doc, payload, fonts);

  if (!payload.dishes.length) {
    doc.fillColor(colors.ink).font(fonts.body).fontSize(12);
    doc.text(payload.labels.noDishes, doc.page.margins.left, doc.y + 12, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: "center",
    });
  } else {
    payload.dishes.forEach((dish, index) => {
      renderDishSection(doc, payload, dish, index, fonts);
    });
  }

  doc.end();

  await new Promise<void>((resolve) => doc.on("end", resolve));
  return Buffer.concat(chunks);
}

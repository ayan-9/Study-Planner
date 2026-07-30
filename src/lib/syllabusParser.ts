import { createWorker } from "tesseract.js";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

export type WeeklyTopic = { week: number; content: string };

const MAX_WEEK = 15;

export async function extractWeeklyTopicsFromFile(file: File): Promise<WeeklyTopic[]> {
  const text = await extractTextFromFile(file);
  return parseWeeklyTopicsFromText(text);
}

async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractTextFromPdf(file);
  }

  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif|tiff?|heic|heif|avif)$/i.test(name)) {
    return extractTextFromImage(file);
  }

  throw new Error("Unsupported syllabus file type. Please upload a PDF or image.");
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  let totalNonWhitespaceChars = 0;

  // First pass: extract text using pdfjs-dist's text layer with position-aware reconstruction
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as Array<Record<string, unknown>>;
    const pageText = reconstructTextFromItems(items);
    fullText += pageText + "\n";
    totalNonWhitespaceChars += pageText.replace(/\s/g, "").length;
  }

  // If text extraction yielded meaningful content, return it
  if (totalNonWhitespaceChars > 20) {
    return fullText;
  }

  // Fallback for scanned / image-only PDFs: render pages to canvas and OCR via Tesseract
  let ocrText = "";
  const worker = await createWorker("eng");
  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
          "image/png"
        );
      });

      const objectUrl = URL.createObjectURL(blob);
      try {
        const result = await worker.recognize(objectUrl);
        ocrText += result.data.text + "\n";
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      // Release canvas memory
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await worker.terminate();
  }

  return ocrText || fullText;
}

/**
 * Reconstruct readable text from pdfjs-dist text content items.
 * Uses the transform matrix (position data) to group items into visual rows
 * and sort them left-to-right, producing much better output for table-based PDFs.
 * Falls back to simple hasEOL-based concatenation when position data is absent.
 */
function reconstructTextFromItems(
  items: Array<Record<string, unknown>>
): string {
  type PositionedItem = {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hasEOL: boolean;
  };

  const textItems: PositionedItem[] = [];

  for (const it of items) {
    const s = typeof it?.str === "string" ? it.str : "";
    if (!s) continue;

    const transform = Array.isArray(it.transform) ? (it.transform as number[]) : null;
    textItems.push({
      str: s,
      x: transform?.[4] ?? 0,
      y: transform?.[5] ?? 0,
      width: typeof it.width === "number" ? it.width : s.length * 5,
      height: typeof it.height === "number" ? it.height : 0,
      hasEOL: !!it.hasEOL,
    });
  }

  if (textItems.length === 0) return "";

  // Check whether we have usable position data
  const hasPositionData = textItems.some((it) => it.x !== 0 || it.y !== 0);

  if (!hasPositionData) {
    // No position data – fall back to hasEOL-based concatenation
    let text = "";
    for (const it of textItems) {
      text += it.str;
      text += it.hasEOL ? "\n" : " ";
    }
    return text;
  }

  // Derive a row-grouping threshold from the median text height
  const heights = textItems.map((it) => it.height).filter((h) => h > 0).sort((a, b) => a - b);
  const medianHeight = heights.length > 0 ? heights[Math.floor(heights.length / 2)] : 10;
  const rowThreshold = Math.max(2, medianHeight * 0.6);

  // Sort top-to-bottom (PDF Y grows upward, so descending Y = visual top-to-bottom),
  // then left-to-right within the same visual row.
  const sorted = [...textItems].sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > rowThreshold) return yDiff;
    return a.x - b.x;
  });

  // Group consecutive items into rows
  const rows: PositionedItem[][] = [];
  let currentRow: PositionedItem[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(currentRow[0].y - sorted[i].y) > rowThreshold) {
      rows.push(currentRow);
      currentRow = [sorted[i]];
    } else {
      currentRow.push(sorted[i]);
    }
  }
  rows.push(currentRow);

  // Build output lines
  const lines: string[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    let line = "";
    for (let i = 0; i < row.length; i++) {
      if (i > 0) {
        const prev = row[i - 1];
        const gap = row[i].x - (prev.x + prev.width);
        line += gap > medianHeight * 0.5 ? "  " : " ";
      }
      line += row[i].str;
    }
    lines.push(line.trim());
  }

  return lines.filter(Boolean).join("\n");
}

async function extractTextFromImage(file: File): Promise<string> {
  const processedUrl = await preprocessImageForOcr(file);
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(processedUrl);

    // Try position-aware reconstruction using word bounding boxes.
    // Tesseract's default text output can garble tables (reads columns separately).
    // By using word-level bbox data we can reconstruct rows properly.
    const positionText = reconstructTextFromOcrWords(result.data);
    if (positionText && positionText.replace(/\s/g, "").length > 20) {
      return positionText;
    }

    // Fallback to Tesseract's default text assembly
    return result.data.text;
  } finally {
    URL.revokeObjectURL(processedUrl);
    await worker.terminate();
  }
}

/**
 * Reconstruct text from Tesseract.js word-level bounding box data.
 * Groups words into visual rows by their vertical center position,
 * then sorts left-to-right within each row — producing clean row-by-row
 * output even for table images where Tesseract may read columns separately.
 */
function reconstructTextFromOcrWords(
  data: { words?: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>; lines?: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> }
): string {
  // Try word-level reconstruction first, fall back to line-level
  const words = data.words;
  if (!words || words.length === 0) {
    // Fall back to line-level if available
    const lines = data.lines;
    if (!lines || lines.length === 0) return "";

    const sortedLines = [...lines]
      .filter((l) => l.text.trim())
      .sort((a, b) => {
        const yCenterA = (a.bbox.y0 + a.bbox.y1) / 2;
        const yCenterB = (b.bbox.y0 + b.bbox.y1) / 2;
        if (Math.abs(yCenterA - yCenterB) > 5) return yCenterA - yCenterB;
        return a.bbox.x0 - b.bbox.x0;
      });
    return sortedLines.map((l) => l.text.trim()).join("\n");
  }

  // Filter out empty words
  const validWords = words.filter((w) => w.text.trim());
  if (validWords.length === 0) return "";

  // Calculate a row-grouping threshold from median word height
  const heights = validWords
    .map((w) => w.bbox.y1 - w.bbox.y0)
    .filter((h) => h > 0)
    .sort((a, b) => a - b);
  const medianHeight = heights.length > 0 ? heights[Math.floor(heights.length / 2)] : 20;
  const rowThreshold = Math.max(5, medianHeight * 0.5);

  // Sort words by vertical center (top to bottom), then horizontal (left to right)
  const sorted = [...validWords].sort((a, b) => {
    const yCenterA = (a.bbox.y0 + a.bbox.y1) / 2;
    const yCenterB = (b.bbox.y0 + b.bbox.y1) / 2;
    if (Math.abs(yCenterA - yCenterB) > rowThreshold) return yCenterA - yCenterB;
    return a.bbox.x0 - b.bbox.x0;
  });

  // Group into rows
  type OcrWord = (typeof sorted)[0];
  const rows: OcrWord[][] = [];
  let currentRow: OcrWord[] = [sorted[0]];
  let currentRowYCenter = (sorted[0].bbox.y0 + sorted[0].bbox.y1) / 2;

  for (let i = 1; i < sorted.length; i++) {
    const yCenter = (sorted[i].bbox.y0 + sorted[i].bbox.y1) / 2;
    if (Math.abs(yCenter - currentRowYCenter) > rowThreshold) {
      rows.push(currentRow);
      currentRow = [sorted[i]];
      currentRowYCenter = yCenter;
    } else {
      currentRow.push(sorted[i]);
    }
  }
  rows.push(currentRow);

  // Build text lines
  const lines: string[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.bbox.x0 - b.bbox.x0);
    let line = "";
    for (let i = 0; i < row.length; i++) {
      if (i > 0) {
        const gap = row[i].bbox.x0 - row[i - 1].bbox.x1;
        line += gap > medianHeight ? "  " : " ";
      }
      line += row[i].text;
    }
    lines.push(line.trim());
  }

  return lines.filter(Boolean).join("\n");
}

/**
 * Preprocess an image for better Tesseract.js OCR accuracy:
 * - Upscales small images so text is large enough for recognition
 * - Converts to grayscale and applies full-range contrast stretching
 * Returns an object URL pointing to the processed PNG.
 */
async function preprocessImageForOcr(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  // Upscale small images so the shorter side is at least 1500px
  const MIN_SIDE = 1500;
  if (Math.min(width, height) < MIN_SIDE) {
    const scale = MIN_SIDE / Math.min(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // Cap very large images to avoid excessive memory usage
  const MAX_SIDE = 4000;
  if (Math.max(width, height) > MAX_SIDE) {
    const scale = MAX_SIDE / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return URL.createObjectURL(file);
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Convert to grayscale and apply contrast stretching
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;

  // First pass: find min/max gray values
  let minGray = 255, maxGray = 0;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (gray < minGray) minGray = gray;
    if (gray > maxGray) maxGray = gray;
  }

  const range = maxGray - minGray || 1;

  // Second pass: apply grayscale + full-range contrast stretch
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const stretched = ((gray - minGray) / range) * 255;
    d[i] = d[i + 1] = d[i + 2] = stretched;
  }
  ctx.putImageData(imageData, 0, 0);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image preprocessing failed"))),
      "image/png"
    );
  });

  // Release canvas memory
  canvas.width = 0;
  canvas.height = 0;

  return URL.createObjectURL(blob);
}

export function parseWeeklyTopicsFromText(rawText: string): WeeklyTopic[] {
  const normalized = (rawText || "")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();

  // Remove obvious table headers when present (PDF text + OCR often includes these).
  const withoutHeaders = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      return !/(week\s*no\.?|s\.?\s*no\.?|topics?\b|no\.?\s*of\s*periods\b|periods\b)/i.test(l);
    })
    .join("\n")
    .replace(/[–—]/g, "-")
    .trim();

  const variants = buildTextVariants(withoutHeaders);

  let best: WeeklyTopic[] = [];
  let bestScore = -Infinity;

  for (const v of variants) {
    const parsed = parseWeeklyTopicsVariant(v);
    const score = scoreTopics(parsed);
    if (score > bestScore) {
      bestScore = score;
      best = parsed;
    }
  }

  return dedupeByWeek(best);
}

function buildTextVariants(text: string): string[] {
  const base = (text || "").trim();
  if (!base) return [""];

  const variants: string[] = [base];

  // Cut footer like: "Total per Semester: 45" but only as a *variant* (some syllabi contain similar wording in topics).
  const totalMatch = base.match(/total\s*per\s*semester/i);
  if (totalMatch?.index != null && totalMatch.index > 0) {
    variants.push(base.slice(0, totalMatch.index).trim());
  }

  // Add a whitespace-flattened variant for OCR that collapses rows into one line.
  variants.push(base.replace(/\n/g, " ").replace(/\s+/g, " ").trim());

  return Array.from(new Set(variants)).filter(Boolean);
}

function parseWeeklyTopicsVariant(text: string): WeeklyTopic[] {
  const t = (text || "").trim();
  if (!t) return [];

  const candidates: WeeklyTopic[][] = [];

  // 1) Line-based parsing (best for PDFs where row boundaries are preserved).
  candidates.push(parseLineWeekRows(t));

  // 2) Inline table parsing (best for OCR that collapses rows).
  candidates.push(parseTableWeekRows(t.replace(/\n/g, " ")));

  // 3) Marker split fallback.
  const markers = findWeekMarkers(t.replace(/\n/g, " "));
  if (markers.length > 0) {
    const out: WeeklyTopic[] = [];
    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      const next = markers[i + 1];

      const startIdx = m.contentStart;
      const endIdx = next ? next.start : t.length;

      const chunk = t.slice(startIdx, endIdx);
      const topic = cleanTopic(chunk);
      if (topic) out.push({ week: m.week, content: topic });
    }
    candidates.push(out);
  }

  // Pick the best candidate by coverage and total content.
  let best: WeeklyTopic[] = [];
  let bestScore = -Infinity;
  for (const c of candidates) {
    const score = scoreTopics(c);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return best;
}

function scoreTopics(items: WeeklyTopic[]): number {
  const weeks = Array.from(new Set(items.map((i) => i.week))).filter((w) => w >= 1 && w <= MAX_WEEK);
  if (weeks.length === 0) return -Infinity;

  const coverage = weeks.length;
  const maxWeek = Math.max(...weeks);
  const totalLen = items.reduce((sum, it) => sum + (it.content?.length ?? 0), 0);

  // Prefer more weeks found, then higher max week, then richer content.
  return coverage * 10000 + maxWeek * 100 + totalLen;
}

function parseLineWeekRows(text: string): WeeklyTopic[] {
  const lines = (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out: WeeklyTopic[] = [];

  let currentWeek: number | null = null;
  let buffer = "";

  const flush = () => {
    if (!currentWeek) return;
    const topic = cleanTopic(buffer);
    if (topic) out.push({ week: currentWeek, content: topic });
  };

  for (const line of lines) {
    if (/total\s*per\s*semester/i.test(line)) break;

    // Accept formats like:
    //  "1. Topic ...", "1) Topic ...", "1 - Topic ...", "Week 1: Topic ...", "1 Topic ..."
    const m = line.match(/^(?:week\s*)?(1[0-5]|[1-9])\s*(?:[\.|\)|-|:])?\s*(.*)$/i);
    if (m) {
      const week = Number(m[1]);
      const rest = (m[2] ?? "").trim();

      // If the line is just a bare number, ignore it.
      if (!rest) continue;

      if (currentWeek !== null) flush();
      currentWeek = week;
      buffer = rest;
      continue;
    }

    if (currentWeek !== null) {
      buffer += ` ${line}`;
    }
  }

  flush();
  return out;
}

type WeekMarker = { week: number; start: number; contentStart: number };

function parseTableWeekRows(text: string): WeeklyTopic[] {
  // Match table rows where the last numeric column is "periods" (e.g., 3).
  // Example OCR output often becomes:
  // "1. Introduction ... Arithmetic. 3 2. Basic Logic Gates ... 3 ..."
  const rows: WeeklyTopic[] = [];

  const rowRegex = /(?:^|\s)(1[0-5]|[1-9])\s*(?:[\.|\)]|\s*-)?\s+(.+?)\s+(\d{1,2})(?=\s+(?:1[0-5]|[1-9])\s*(?:[\.|\)]|\s*-)?\s+|$)/g;
  for (const match of text.matchAll(rowRegex)) {
    const week = Number(match[1]);
    if (!Number.isFinite(week) || week < 1 || week > MAX_WEEK) continue;

    const topicRaw = match[2] ?? "";
    const topic = cleanTopic(topicRaw);
    if (!topic) continue;

    rows.push({ week, content: topic });
  }

  return rows;
}

function findWeekMarkers(text: string): WeekMarker[] {
  const markers: WeekMarker[] = [];

  // Prefer explicit week markers like "2." or "2)" (typical in outlines).
  // NOTE: This can be noisy for table OCR; we keep it as a fallback.
  const dotRegex = /(^|[^0-9])(1[0-5]|[1-9])\s*[\.|\)]\s*/g;
  for (const match of text.matchAll(dotRegex)) {
    const week = Number(match[2]);
    if (!Number.isFinite(week) || week < 1 || week > MAX_WEEK) continue;

    const start = (match.index ?? 0) + match[1].length;
    const contentStart = (match.index ?? 0) + match[0].length;

    markers.push({ week, start, contentStart });
  }

  // Fallback for formats like: "1 Introduction to ..." (no dot).
  if (markers.length === 0) {
    const noDotRegex = /(^|[^0-9])(1[0-5]|[1-9])\s+(?=[A-Za-z])/g;
    for (const match of text.matchAll(noDotRegex)) {
      const week = Number(match[2]);
      if (!Number.isFinite(week) || week < 1 || week > MAX_WEEK) continue;

      const start = (match.index ?? 0) + match[1].length;
      const contentStart = (match.index ?? 0) + match[0].length;

      markers.push({ week, start, contentStart });
    }
  }

  // Sort by appearance and drop duplicates of the same week (keep first marker).
  const seen = new Set<number>();
  return markers
    .sort((a, b) => a.start - b.start)
    .filter((m) => {
      if (seen.has(m.week)) return false;
      seen.add(m.week);
      return true;
    });
}

function dedupeByWeek(items: WeeklyTopic[]): WeeklyTopic[] {
  const byWeek = new Map<number, string>();
  for (const item of items) {
    const prev = byWeek.get(item.week);
    if (!prev || item.content.length > prev.length) byWeek.set(item.week, item.content);
  }

  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, content]) => ({ week, content }));
}

function cleanTopic(chunk: string): string {
  const s = (chunk || "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Remove trailing "No. of periods" values (often a lone number like 3).
  const noTrailingPeriods = s.replace(/\s+\d{1,2}\s*$/g, "").trim();

  // Remove accidental duplicate separators/spaces.
  return noTrailingPeriods.replace(/\s+,/g, ",").trim();
}


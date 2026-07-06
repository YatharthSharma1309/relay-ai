import path from "path";
import { pathToFileURL } from "url";
import mammoth from "mammoth";
import { appConfig } from "@/lib/recruitment/config";
import type { AllowedUploadMime } from "@/lib/recruitment/validators";

type PdfTextItem = {
  str?: string;
};

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: AllowedUploadMime
): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractPdfText(buffer);
  }

  const result = await mammoth.extractRawText({ buffer });
  return normalizeResumeText(result.value ?? "");
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return normalizeResumeText(result.text ?? "");
  } catch {
    return extractPdfTextWithPdfJs(buffer);
  }
}

async function extractPdfTextWithPdfJs(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const standardFontDataUrl = `${pathToFileURL(
    path.join(process.cwd(), "node_modules", "pdfjs-dist", "standard_fonts")
  ).href}/`;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl,
  });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => (item as PdfTextItem).str)
        .filter((text): text is string => typeof text === "string")
        .join(" ");

      pages.push(pageText);
    }
  } finally {
    await loadingTask.destroy();
  }

  return normalizeResumeText(pages.join("\n"));
}

export function normalizeResumeText(text: string): string {
  const collapsed = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
  if (collapsed.length <= appConfig.maxResumeTextChars) {
    return collapsed;
  }
  return `${collapsed.slice(0, appConfig.maxResumeTextChars)}\n\n[Truncated for analysis]`;
}

export function displayNameFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  return base.replace(/[-_]+/g, " ").trim() || "Candidate";
}

import path from "path";
import { db } from "@/lib/db";
import { chunkText, estimateTokenCount } from "@/lib/rag/chunk";
import { createEmbeddings } from "@/lib/rag/embed";

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  fileType: string,
): Promise<string> {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".txt" || extension === ".md" || fileType.includes("text")) {
    return buffer.toString("utf-8");
  }

  if (extension === ".pdf" || fileType.includes("pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  if (extension === ".docx" || fileType.includes("word")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${extension || fileType}`);
}

export async function ingestUploadedFile(organizationId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileType = file.type || path.extname(file.name).replace(".", "");
  const title = file.name.replace(/\.[^.]+$/, "");

  const document = await db.document.create({
    data: {
      organizationId,
      title,
      fileName,
      fileType,
      filePath: null,
      fileSize: buffer.length,
      status: "PROCESSING",
    },
  });

  try {
    const text = await extractTextFromBuffer(buffer, file.name, fileType);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error("No text could be extracted from this document");
    }

    await db.documentChunk.deleteMany({
      where: { documentId: document.id },
    });

    const embeddings = await createEmbeddings(chunks);

    await db.$transaction(
      chunks.map((content, index) =>
        db.documentChunk.create({
          data: {
            documentId: document.id,
            content,
            chunkIndex: index,
            tokenCount: estimateTokenCount(content),
            embedding: embeddings[index] ?? undefined,
          },
        }),
      ),
    );

    return db.document.update({
      where: { id: document.id },
      data: {
        status: "READY",
        chunkCount: chunks.length,
        errorMessage: null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process document";

    await db.document.update({
      where: { id: document.id },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    throw error;
  }
}

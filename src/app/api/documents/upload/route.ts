import { NextResponse } from "next/server";
import { withAdminMembership } from "@/lib/auth/api";
import { isAllowedUpload, MAX_UPLOAD_BYTES } from "@/lib/documents/constants";
import { ingestUploadedFile } from "@/lib/documents/process";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

function uploadErrorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Failed to process document";

  if (message.includes("Unsupported file type")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (message.includes("No text could be extracted")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json(
    { error: "Failed to process document" },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  return withAdminMembership(async ({ organization }) => {
    if (
      await checkRateLimit(`upload:${organization.id}`, 10, 60 * 60 * 1000)
    ) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File must be 10 MB or smaller." },
        { status: 413 },
      );
    }

    if (!isAllowedUpload(file)) {
      return NextResponse.json(
        { error: "Only PDF, DOCX, TXT, and Markdown files are supported." },
        { status: 400 },
      );
    }

    try {
      const document = await ingestUploadedFile(organization.id, file);
      return NextResponse.json({ document });
    } catch (error) {
      return uploadErrorResponse(error);
    }
  });
}

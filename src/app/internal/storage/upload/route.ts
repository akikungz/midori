import createFetchClient from "openapi-fetch";
import { NextResponse } from "next/server";

import type { paths } from "@midori/types/api";
import { env } from "@midori/lib/env";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 },
      );
    }

    const cookie = request.headers.get("cookie") ?? "";

    const serverApi = createFetchClient<paths>({
      baseUrl: env.SERVER_API_URL,
      headers: {
        cookie,
      },
    });

    const contentType = file.type || "application/octet-stream";

    const { data: uploadData, error: uploadUrlError } = await serverApi.POST(
      "/api/storage/files/upload-url",
      {
        body: {
          filename: file.name,
          contentType,
        },
      },
    );

    if (uploadUrlError || !uploadData?.uploadUrl || !uploadData.objectKey) {
      return NextResponse.json(
        { message: "Unable to create upload URL" },
        { status: 502 },
      );
    }

    const uploadResponse = await fetch(uploadData.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      let message = `Upload target rejected file with status ${uploadResponse.status}`;

      if (uploadResponse.status === 413) {
        message = "File is too large for the storage backend. Please try a smaller file.";
      } else if (uploadResponse.status === 400) {
        message =
          "Invalid file format or upload request rejected by storage backend.";
      }

      return NextResponse.json(
        { message },
        { status: 502 },
      );
    }

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase()
      : undefined;

    const { data: createdFile, error: createFileError } = await serverApi.POST(
      "/api/storage/files/",
      {
        body: {
          name: file.name,
          type: "FILE",
          mimeType: contentType,
          sizeBytes: file.size,
          storagePath: uploadData.objectKey,
          visibility: "PRIVATE",
          ...(extension ? { extension } : {}),
        },
      },
    );

    if (createFileError || !createdFile) {
      return NextResponse.json(
        { message: "Upload completed but metadata creation failed" },
        { status: 502 },
      );
    }

    return NextResponse.json(createdFile, { status: 200 });
  } catch (error) {
    console.error("Storage upload proxy failed:", error);
    return NextResponse.json(
      { message: "Failed to upload file" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface ImageKitResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  filePath: string;
  height: number;
  width: number;
  size: number;
  fileType: string;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "companies";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: "ImageKit private key not configured" }, { status: 500 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("fileName", file.name || "upload");
    uploadFormData.append("folder", `/${folder}`);
    uploadFormData.append("useUniqueFileName", "true");

    const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return NextResponse.json({ error: `Upload failed: ${errorText}` }, { status: uploadResponse.status });
    }

    const imageKitData: ImageKitResponse = await uploadResponse.json();

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .insert({
        url: imageKitData.url,
        name: imageKitData.name,
        type: imageKitData.fileType === "image" ? "image" : "doc",
      })
      .select()
      .single();

    if (assetError) {
      return NextResponse.json({ error: "Failed to create asset record", details: assetError }, { status: 500 });
    }

    return NextResponse.json({
      url: imageKitData.url,
      asset_id: asset.id,
      fileId: imageKitData.fileId,
      name: imageKitData.name,
      width: imageKitData.width,
      height: imageKitData.height,
      size: imageKitData.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

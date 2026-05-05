export interface ImageKitUploadResponse {
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

export async function uploadToImageKit(
  file: File,
  folder: string = "companies"
): Promise<ImageKitUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name || "upload");
  formData.append("folder", `/${folder}`);
  formData.append("useUniqueFileName", "true");

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  
  if (!publicKey) {
    throw new Error("ImageKit public key not configured");
  }

  formData.append("publicKey", publicKey);

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload image: ${errorText}`);
  }

  return response.json();
}

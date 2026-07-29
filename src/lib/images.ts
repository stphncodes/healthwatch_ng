// Module: Image Utils | Owner: Frontend Lead
// Client-side downscale/compress for identity-document uploads. Keeps files
// small enough for the private storage bucket's 2 MB limit (Supabase mode)
// and for localStorage persistence as data URLs (local demo mode).

/** Sources larger than this are rejected before any decoding is attempted. */
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export interface CompressedImage {
  /** JPEG blob, uploaded to Supabase Storage. */
  blob: Blob;
  /** Same image as a data URL — used for previews and local-mode persistence. */
  dataUrl: string;
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Downscale an image so its longest side is at most `maxDimension` pixels and
 * re-encode it as JPEG. Throws for non-image or oversized files — callers show
 * the message as a field error.
 */
export async function compressImage(
  file: File,
  opts: { maxDimension?: number; quality?: number } = {},
): Promise<CompressedImage> {
  const { maxDimension = 1024, quality = 0.72 } = opts;
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a JPEG or PNG photo.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("That photo is too large — choose one under 10 MB.");
  }

  const source = await decodeImage(file);
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image in this browser.");
  // Identity documents are photographed on light/dark tables — flatten any
  // transparency to white so JPEG re-encoding doesn't turn it black.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not compress the image."))),
      "image/jpeg",
      quality,
    );
  });
  return { blob, dataUrl: await blobToDataUrl(blob) };
}

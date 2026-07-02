import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { env } from "@/config/env";

// Works with both Cloudflare R2 and AWS S3 (R2 is S3-API compatible).
export const s3 = new S3Client({
  endpoint: env.s3.endpoint || undefined,
  region: env.s3.region,
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
});

/** Uploads a buffer (e.g. from multer memory storage) and returns its public URL. */
export async function uploadBuffer(params: {
  buffer: Buffer;
  mimeType: string;
  folder: string; // e.g. "delivery-proofs/<orderId>"
}): Promise<string> {
  const key = `${params.folder}/${randomUUID()}`;

  await s3.send(new PutObjectCommand({
    Bucket: env.s3.bucket,
    Key: key,
    Body: params.buffer,
    ContentType: params.mimeType,
  }));

  return `${env.s3.publicBaseUrl}/${key}`;
}

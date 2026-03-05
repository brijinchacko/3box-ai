import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an avatar image to Cloudinary.
 * Falls back to a base64 data URL if Cloudinary env vars are not configured.
 */
export async function uploadAvatar(
  buffer: Buffer,
  userId: string
): Promise<string> {
  // Fallback: if Cloudinary is not configured, return a base64 data URL
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    const base64 = buffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  }

  // Upload to Cloudinary
  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'nxted/avatars',
          public_id: userId,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 256, height: 256, crop: 'fill', gravity: 'face' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as { secure_url: string });
        }
      );

      uploadStream.end(buffer);
    }
  );

  return result.secure_url;
}

export default cloudinary;

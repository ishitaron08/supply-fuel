import { v2 as cloudinary } from 'cloudinary';
import config from './config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export { cloudinary };

/**
 * Upload a buffer to Cloudinary
 * @param buffer - file buffer to upload
 * @param folder - Cloudinary folder (e.g., 'invoices', 'bills')
 * @param publicId - optional public ID (filename without extension)
 * @param resourceType - 'image' | 'raw' | 'auto' (use 'raw' for PDFs)
 * @returns Cloudinary upload result with secure_url
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string,
  resourceType: 'image' | 'raw' | 'auto' = 'auto'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('Cloudinary upload returned no result'));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by public ID
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' = 'raw'
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

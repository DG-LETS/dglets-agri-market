import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

export interface CloudinaryUploadResult {
  url:       string;
  publicId:  string;
  width:     number;
  height:    number;
  format:    string;
  bytes:     number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly config: ConfigService) {}

  /* ── Upload a single image buffer to Cloudinary ── */
  async uploadImage(
    fileBuffer: Buffer,
    mimetype:   string,
    folder:     string = 'dglets',
  ): Promise<CloudinaryUploadResult> {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME', '');
    const apiKey    = this.config.get<string>('CLOUDINARY_API_KEY',    '');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET', '');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn('Cloudinary not configured — returning placeholder URL');
      return {
        url:      'https://placehold.co/400x400/1e5c3a/ffffff?text=DG-LETS',
        publicId: `placeholder_${Date.now()}`,
        width:    400,
        height:   400,
        format:   'png',
        bytes:    0,
      };
    }

    /* Build signed upload via Cloudinary REST API (no SDK needed) */
    const timestamp    = Math.floor(Date.now() / 1000).toString();
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature    = createHmac('sha256', apiSecret)
      .update(paramsToSign)
      .digest('hex');

    /* Build multipart form — use Uint8Array to avoid Buffer/BlobPart type conflict */
    const uint8 = new Uint8Array(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
    const blob  = new Blob([uint8], { type: mimetype });

    const form = new FormData();
    form.append('file',      blob, 'upload');
    form.append('api_key',   apiKey);
    form.append('timestamp', timestamp);
    form.append('folder',    folder);
    form.append('signature', signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response  = await fetch(uploadUrl, { method: 'POST', body: form });
    const result    = await response.json() as any;

    if (!response.ok || result.error) {
      const msg = result?.error?.message ?? 'Cloudinary upload failed';
      this.logger.error(`Cloudinary error: ${msg}`);
      throw new BadRequestException(`Image upload failed: ${msg}`);
    }

    return {
      url:      result.secure_url  as string,
      publicId: result.public_id   as string,
      width:    result.width       as number,
      height:   result.height      as number,
      format:   result.format      as string,
      bytes:    result.bytes       as number,
    };
  }

  /* ── Upload multiple images ── */
  async uploadImages(
    files:  Array<{ buffer: Buffer; mimetype: string }>,
    folder: string = 'dglets',
  ): Promise<string[]> {
    const results = await Promise.all(
      files.map(f => this.uploadImage(f.buffer, f.mimetype, folder)),
    );
    return results.map(r => r.url);
  }
}

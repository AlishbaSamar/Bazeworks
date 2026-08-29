import { createHash } from 'crypto';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CloudinaryResourceType = 'image' | 'video' | 'raw';

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/**
 * Thin Cloudinary client — just the two operations the media library needs
 * (sign a direct browser upload, delete an asset). Uses raw crypto + fetch
 * rather than the SDK to keep the dependency surface small; Cloudinary's
 * signature is sha1 of the alphabetically-sorted signed params joined as
 * "k=v&k2=v2" with the api_secret appended.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {}

  get configured(): boolean {
    return Boolean(
      this.config.get('CLOUDINARY_CLOUD_NAME') &&
      this.config.get('CLOUDINARY_API_KEY') &&
      this.config.get('CLOUDINARY_API_SECRET'),
    );
  }

  private creds() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Media storage is not configured on the server.',
      );
    }
    return { cloudName, apiKey, apiSecret };
  }

  private sign(params: Record<string, string | number>, apiSecret: string) {
    const toSign = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return createHash('sha1')
      .update(toSign + apiSecret)
      .digest('hex');
  }

  /** Params the browser POSTs alongside the file to Cloudinary's upload endpoint. */
  signUpload(websiteId: string): SignedUpload {
    const { cloudName, apiKey, apiSecret } = this.creds();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `bazeworks/${websiteId}`;
    const signature = this.sign({ folder, timestamp }, apiSecret);
    return { cloudName, apiKey, timestamp, signature, folder };
  }

  async destroy(
    externalId: string,
    resourceType: CloudinaryResourceType,
  ): Promise<void> {
    if (!this.configured) return;
    const { cloudName, apiKey, apiSecret } = this.creds();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.sign(
      { public_id: externalId, timestamp },
      apiSecret,
    );
    const body = new URLSearchParams({
      public_id: externalId,
      api_key: apiKey,
      timestamp: String(timestamp),
      signature,
    });
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
        { method: 'POST', body },
      );
      if (!res.ok) {
        // Non-fatal: the DB record is already gone; a leftover Cloudinary
        // asset is a cleanup concern, not a user-facing failure.
        this.logger.warn(
          `Cloudinary destroy failed for ${externalId}: ${res.status}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Cloudinary destroy errored for ${externalId}: ${String(err)}`,
      );
    }
  }
}

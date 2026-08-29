import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAssetDto {
  // Cloudinary public_id returned by the upload response.
  @IsString()
  @MaxLength(300)
  externalId: string;

  @IsUrl({ require_tld: false })
  url: string;

  @IsString()
  @MaxLength(255)
  filename: string;

  @IsString()
  @MaxLength(150)
  mimeType: string;

  @IsInt()
  @Min(1)
  bytes: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  height?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  alt?: string;
}

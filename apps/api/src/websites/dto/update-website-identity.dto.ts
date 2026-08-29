import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateWebsiteIdentityDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(48)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug may only contain lowercase letters, numbers and hyphens.',
  })
  slug?: string;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== '' && v != null)
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== '' && v != null)
  @IsString()
  @MaxLength(500)
  faviconUrl?: string;
}

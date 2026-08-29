import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export const ROBOTS_OPTIONS = [
  'index,follow',
  'noindex,follow',
  'index,nofollow',
  'noindex,nofollow',
] as const;
export type RobotsDirective = (typeof ROBOTS_OPTIONS)[number];

const url = () =>
  ValidateIf((_, v: unknown) => v !== '' && v !== null && v !== undefined);

export class UpdatePageSeoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  description?: string;

  @IsOptional()
  @url()
  @IsString()
  @MaxLength(500)
  canonicalUrl?: string;

  @IsOptional()
  @IsIn(ROBOTS_OPTIONS)
  robots?: RobotsDirective;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ogTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  ogDescription?: string;

  @IsOptional()
  @url()
  @IsString()
  @MaxLength(500)
  ogImage?: string;
}

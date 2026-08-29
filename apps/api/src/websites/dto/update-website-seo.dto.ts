import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  ROBOTS_OPTIONS,
  type RobotsDirective,
} from '../../pages/dto/update-page-seo.dto';

export class UpdateWebsiteSeoDto {
  @IsOptional()
  @IsString()
  @MaxLength(320)
  description?: string;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== '' && v != null)
  @IsString()
  @MaxLength(500)
  ogImage?: string;

  @IsOptional()
  @IsIn(ROBOTS_OPTIONS)
  robots?: RobotsDirective;

  // When false, robots.txt disallows everything and pages get noindex.
  @IsOptional()
  @IsBoolean()
  indexable?: boolean;

  // e.g. "%s — Acme" — %s is replaced with the page's SEO/name title.
  @IsOptional()
  @IsString()
  @MaxLength(80)
  titleTemplate?: string;
}

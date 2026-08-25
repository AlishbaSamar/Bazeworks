import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const PAGE_TYPES = [
  'blank',
  'home',
  'about',
  'services',
  'pricing',
  'contact',
  'blog',
] as const;

export type PageType = (typeof PAGE_TYPES)[number];

export class CreatePageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsIn(PAGE_TYPES)
  pageType?: PageType;
}

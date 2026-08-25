import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const SLUG_PATTERN = /^\/([a-z0-9]+(-[a-z0-9]+)*)?$/;

export class RenamePageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, {
    message:
      'Slug must start with / and contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;
}

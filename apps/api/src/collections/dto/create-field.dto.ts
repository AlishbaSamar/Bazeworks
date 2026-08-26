import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const FIELD_TYPES = [
  'TEXT',
  'TEXTAREA',
  'RICH_TEXT',
  'NUMBER',
  'BOOLEAN',
  'DATE',
  'DATE_TIME',
  'IMAGE',
  'FILE',
  'URL',
  'EMAIL',
  'SELECT',
  'MULTI_SELECT',
  'RELATION',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export class CreateFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @IsIn(FIELD_TYPES)
  type: FieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  relatedCollectionId?: string;
}

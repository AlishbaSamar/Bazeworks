import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SaveAsTemplateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;
}

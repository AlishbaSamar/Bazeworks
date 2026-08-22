import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWebsiteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

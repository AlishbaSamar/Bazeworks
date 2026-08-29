import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PublishDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

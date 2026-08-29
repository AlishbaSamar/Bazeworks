import { IsString, MaxLength } from 'class-validator';

export class UpdateAssetDto {
  @IsString()
  @MaxLength(300)
  alt: string;
}

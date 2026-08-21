import { IsString, MaxLength, MinLength } from 'class-validator';

export class RenameWorkspaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;
}

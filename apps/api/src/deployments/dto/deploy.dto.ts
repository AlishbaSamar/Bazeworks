import { IsOptional, IsString } from 'class-validator';

export class DeployDto {
  // When set, deploys that specific publication instead of the latest —
  // this is how "roll back to this snapshot" works.
  @IsOptional()
  @IsString()
  publicationId?: string;
}

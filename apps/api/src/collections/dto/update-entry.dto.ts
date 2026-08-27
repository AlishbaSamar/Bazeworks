import { IsObject } from 'class-validator';

export class UpdateEntryDto {
  @IsObject()
  data: Record<string, unknown>;
}

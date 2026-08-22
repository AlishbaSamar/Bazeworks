import { IsObject } from 'class-validator';

export class UpdatePageContentDto {
  @IsObject()
  content: Record<string, unknown>;
}

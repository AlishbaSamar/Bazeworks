import { IsObject } from 'class-validator';

export class UpdateGlobalComponentDto {
  @IsObject()
  props: Record<string, unknown>;
}

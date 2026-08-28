import { IsIn } from 'class-validator';

export class UpdateEntryStatusDto {
  @IsIn(['DRAFT', 'PUBLISHED'])
  status: 'DRAFT' | 'PUBLISHED';
}

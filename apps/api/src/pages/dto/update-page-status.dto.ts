import { IsIn } from 'class-validator';

export class UpdatePageStatusDto {
  @IsIn(['DRAFT', 'PUBLISHED'])
  status: 'DRAFT' | 'PUBLISHED';
}

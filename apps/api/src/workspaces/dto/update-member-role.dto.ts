import { IsIn } from 'class-validator';
import { ASSIGNABLE_ROLES, type AssignableRole } from './add-member.dto';

export class UpdateMemberRoleDto {
  @IsIn(ASSIGNABLE_ROLES)
  role: AssignableRole;
}

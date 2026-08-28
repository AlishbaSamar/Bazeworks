import { IsEmail, IsIn } from 'class-validator';

// OWNER is deliberately excluded — ownership transfer is a separate,
// higher-friction action, not something you hand out when inviting a member.
export const ASSIGNABLE_ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsIn(ASSIGNABLE_ROLES)
  role: AssignableRole;
}

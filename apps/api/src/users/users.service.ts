import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { email: string; fullName: string; passwordHash?: string }) {
    return this.prisma.user.create({ data });
  }

  markEmailVerified(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { emailVerified: true },
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}

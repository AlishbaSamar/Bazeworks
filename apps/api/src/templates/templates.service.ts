import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const templates = await this.prisma.template.findMany({
      where: { isOfficial: true },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { pages: true } } },
    });
    return templates.map(({ _count, ...template }) => ({
      ...template,
      pageCount: _count.pages,
    }));
  }

  async getWithPages(templateId: string) {
    return this.prisma.template.findUnique({
      where: { id: templateId },
      include: { pages: true },
    });
  }
}

import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { parseTags, toProjectDetail } from '../utils/projectDto.js';

export async function buildProjectDetail(projectId: bigint, viewerId?: bigint) {
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, nickname: true, avatar: true } },
      members: {
        include: {
          user: { select: { id: true, nickname: true, avatar: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!project) return null;

  if (project.isDraft === 1) {
    if (!viewerId || project.ownerId !== viewerId) {
      return null;
    }
  }

  let isFavorite = false;
  let hasApplied = false;

  if (viewerId && project.isDraft === 0) {
    const [favorite, application] = await Promise.all([
      prisma.userFavorite.findUnique({
        where: {
          userId_projectId: { userId: viewerId, projectId },
        },
      }),
      prisma.projectApplication.findFirst({
        where: { userId: viewerId, projectId },
      }),
    ]);
    isFavorite = !!favorite;
    hasApplied = !!application;
  }

  return toProjectDetail(project, project.owner, project.members, {
    isFavorite,
    hasApplied,
    isDraft: project.isDraft === 1,
  });
}

export async function computeMatchForUser(userId: bigint, projectTags: string | null) {
  const tags = parseTags(projectTags);
  if (tags.length === 0) return null;

  const skills = await prisma.userSkill.findMany({ where: { userId } });
  const skillNames = skills.map((s) => s.skillName.toLowerCase());
  if (skillNames.length === 0) return null;

  let hits = 0;
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (skillNames.some((s) => s.includes(lower) || lower.includes(s))) {
      hits += 1;
    }
  }
  if (hits === 0) return null;

  const score = Math.min(99, 60 + hits * 15);
  return {
    matchScore: score,
    matchReason: `与您的技能标签有 ${hits} 处相关`,
  };
}

export function buildProjectListWhere(query: {
  keyword?: string;
  tag?: string;
}): Prisma.ProjectWhereInput {
  const and: Prisma.ProjectWhereInput[] = [{ isDraft: 0 }];

  if (query.keyword?.trim()) {
    const kw = query.keyword.trim();
    and.push({
      OR: [{ title: { contains: kw } }, { tags: { contains: kw } }],
    });
  }

  if (query.tag?.trim()) {
    and.push({ tags: { contains: query.tag.trim() } });
  }

  return { AND: and };
}

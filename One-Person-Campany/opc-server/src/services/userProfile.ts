import { prisma } from '../lib/prisma.js';
import { toUserPublic } from '../utils/userDto.js';

export async function loadUserProfile(userId: bigint) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const [skills, projectsJoined, applicationsPending, applicationsToReview] =
    await Promise.all([
      prisma.userSkill.findMany({
        where: { userId },
        orderBy: { id: 'asc' },
      }),
      prisma.projectMember.count({ where: { userId } }),
      prisma.projectApplication.count({
        where: { userId, status: 'pending' },
      }),
      prisma.projectApplication.count({
        where: {
          status: 'pending',
          project: { ownerId: userId },
        },
      }),
    ]);

  return toUserPublic(user, skills, {
    projectsJoined,
    applicationsPending,
    applicationsToReview,
  });
}

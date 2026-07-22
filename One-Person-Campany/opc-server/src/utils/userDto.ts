import type { User, UserSkill } from '@prisma/client';

export type UserStats = {
  projectsJoined: number;
  applicationsPending: number;
};

export function toUserPublic(
  user: User,
  skills: UserSkill[],
  stats: UserStats,
) {
  return {
    id: Number(user.id),
    phone: user.phone,
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    skills: skills.map((s) => s.skillName),
    stats: {
      projectsJoined: stats.projectsJoined,
      applicationsPending: stats.applicationsPending,
    },
  };
}

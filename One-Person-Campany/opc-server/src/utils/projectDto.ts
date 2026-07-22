import type { Project, ProjectMember, User } from '@prisma/client';

export type ProjectRole = {
  name: string;
  count?: number;
  filled?: number;
  recommended?: boolean;
};

export type ProjectPhase = {
  name: string;
  status?: string;
};

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags?.trim()) return [];
  return tags
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function normalizeTagsInput(tags: unknown): string | null {
  if (tags == null || tags === '') return null;
  if (Array.isArray(tags)) {
    const joined = tags
      .map((t) => String(t).trim())
      .filter(Boolean)
      .join(',');
    return joined || null;
  }
  const s = String(tags).trim();
  return s || null;
}

export function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function stringifyJsonField(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value.trim() || null;
  return JSON.stringify(value);
}

export function formatDateOnly(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

type MemberWithUser = ProjectMember & { user: Pick<User, 'id' | 'nickname' | 'avatar'> };

export function toProjectListItem(
  project: Project,
  extras: {
    isFavorite?: boolean;
    matchScore?: number;
    matchReason?: string;
  } = {},
) {
  const base = {
    id: Number(project.id),
    title: project.title,
    cover: project.cover,
    tags: parseTags(project.tags),
    status: project.status,
    teamCurrent: project.teamCurrent,
    teamMax: project.teamMax,
    deadline: formatDateOnly(project.deadline),
    viewCount: project.viewCount,
    heatScore: project.viewCount,
    isFavorite: extras.isFavorite ?? false,
  };

  if (extras.matchScore != null) {
    return {
      ...base,
      matchScore: extras.matchScore,
      matchReason: extras.matchReason ?? '',
    };
  }
  return base;
}

export function toProjectDetail(
  project: Project,
  owner: Pick<User, 'id' | 'nickname' | 'avatar'>,
  members: MemberWithUser[],
  extras: {
    isFavorite?: boolean;
    hasApplied?: boolean;
    isDraft?: boolean;
  } = {},
) {
  return {
    id: Number(project.id),
    title: project.title,
    description: project.description,
    cover: project.cover,
    tags: parseTags(project.tags),
    status: project.status,
    workMode: project.workMode,
    durationWeeks: project.durationWeeks,
    deadline: formatDateOnly(project.deadline),
    teamCurrent: project.teamCurrent,
    teamMax: project.teamMax,
    progress: project.progress,
    roles: parseJsonArray<ProjectRole>(project.rolesJson),
    phases: parseJsonArray<ProjectPhase>(project.phasesJson),
    aiSummary: project.aiSummary,
    isDraft: extras.isDraft ?? project.isDraft === 1,
    owner: {
      id: Number(owner.id),
      nickname: owner.nickname,
      avatar: owner.avatar,
    },
    members: members.map((m) => ({
      userId: Number(m.user.id),
      nickname: m.user.nickname,
      avatar: m.user.avatar,
      roleName: m.roleName,
    })),
    isFavorite: extras.isFavorite ?? false,
    hasApplied: extras.hasApplied ?? false,
  };
}

export function toDraftListItem(project: Project) {
  return {
    id: Number(project.id),
    title: project.title,
    tags: parseTags(project.tags),
    updatedAt: project.updatedAt.toISOString(),
  };
}

import type { Prisma } from '@prisma/client';
import {
  normalizeTagsInput,
  stringifyJsonField,
} from '../utils/projectDto.js';

export function parseDeadline(value: unknown): Date | null {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function buildCreateProjectData(
  body: Record<string, unknown>,
  ownerId: bigint,
  isDraft: boolean,
): Prisma.ProjectCreateInput {
  const titleRaw = typeof body.title === 'string' ? body.title.trim() : '';
  const title = titleRaw || (isDraft ? '未命名草稿' : '');

  return {
    owner: { connect: { id: ownerId } },
    title,
    description:
      typeof body.description === 'string' ? body.description : null,
    cover: typeof body.cover === 'string' ? body.cover.trim() || null : null,
    rawInput: typeof body.rawInput === 'string' ? body.rawInput : null,
    tags: normalizeTagsInput(body.tags),
    workMode: typeof body.workMode === 'string' ? body.workMode : 'remote',
    durationWeeks:
      body.durationWeeks != null ? Number(body.durationWeeks) || null : null,
    deadline: parseDeadline(body.deadline),
    teamMax: body.teamMax != null ? Number(body.teamMax) || 5 : 5,
    rolesJson: stringifyJsonField(body.rolesJson ?? body.roles),
    phasesJson: stringifyJsonField(body.phasesJson ?? body.phases),
    aiSummary: typeof body.aiSummary === 'string' ? body.aiSummary : null,
    isDraft: isDraft ? 1 : 0,
    status: isDraft ? 'draft' : 'recruiting',
    teamCurrent: isDraft ? 0 : 1,
  };
}

export function buildUpdateProjectData(
  body: Record<string, unknown>,
): Prisma.ProjectUpdateInput {
  const data: Prisma.ProjectUpdateInput = {};

  if (typeof body.title === 'string') {
    data.title = body.title.trim() || '未命名草稿';
  }
  if (typeof body.description === 'string') {
    data.description = body.description;
  }
  if (typeof body.cover === 'string') {
    data.cover = body.cover.trim() || null;
  }
  if (typeof body.rawInput === 'string') {
    data.rawInput = body.rawInput;
  }
  if (body.tags !== undefined) {
    data.tags = normalizeTagsInput(body.tags);
  }
  if (typeof body.workMode === 'string') {
    data.workMode = body.workMode;
  }
  if (body.durationWeeks !== undefined) {
    data.durationWeeks =
      body.durationWeeks != null ? Number(body.durationWeeks) || null : null;
  }
  if (body.deadline !== undefined) {
    data.deadline = parseDeadline(body.deadline);
  }
  if (body.teamMax !== undefined) {
    data.teamMax = Number(body.teamMax) || 5;
  }
  if (body.rolesJson !== undefined || body.roles !== undefined) {
    data.rolesJson = stringifyJsonField(body.rolesJson ?? body.roles);
  }
  if (body.phasesJson !== undefined || body.phases !== undefined) {
    data.phasesJson = stringifyJsonField(body.phasesJson ?? body.phases);
  }
  if (typeof body.aiSummary === 'string') {
    data.aiSummary = body.aiSummary;
  }

  return data;
}

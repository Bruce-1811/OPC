import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function ensureOwnerAsMember(
  tx: Prisma.TransactionClient,
  projectId: bigint,
  ownerId: bigint,
) {
  const exists = await tx.projectMember.findFirst({
    where: { projectId, userId: ownerId },
  });
  if (!exists) {
    await tx.projectMember.create({
      data: {
        projectId,
        userId: ownerId,
        roleName: '发起人',
      },
    });
  }
}

export async function publishProjectRecord(
  tx: Prisma.TransactionClient,
  projectId: bigint,
  ownerId: bigint,
  teamCurrent: number,
) {
  await tx.project.update({
    where: { id: projectId },
    data: {
      isDraft: 0,
      status: 'recruiting',
      teamCurrent: Math.max(teamCurrent, 1),
    },
  });
  await ensureOwnerAsMember(tx, projectId, ownerId);
}

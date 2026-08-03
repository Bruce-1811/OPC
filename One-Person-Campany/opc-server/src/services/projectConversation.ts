import type { Prisma } from '@prisma/client';


export async function ensureProjectConversation(
  tx: Prisma.TransactionClient,
  projectId: bigint,
  userIds: bigint[],
  options?: { name?: string | null },
): Promise<bigint> {
  let conversation = await tx.conversation.findFirst({
    where: { type: 'project', projectId },
  });

  if (!conversation) {
    const project =
      options?.name != null
        ? null
        : await tx.project.findUnique({
            where: { id: projectId },
            select: { title: true },
          });
    const name =
      options?.name?.trim() ||
      (project?.title ? `${project.title}小组` : '项目小组');

    conversation = await tx.conversation.create({
      data: {
        type: 'project',
        projectId,
        name,
      },
    });
  }

  const uniqueUserIds = [...new Set(userIds.map((id) => id.toString()))].map(
    (id) => BigInt(id),
  );

  for (const userId of uniqueUserIds) {
    await tx.conversationUser.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId,
        },
      },
      create: {
        conversationId: conversation.id,
        userId,
        unreadCount: 0,
      },
      update: {},
    });
  }

  return conversation.id;
}

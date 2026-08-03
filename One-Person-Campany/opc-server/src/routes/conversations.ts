import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId, requireAuth } from '../middleware/auth.js';
import { ensureProjectConversation } from '../services/projectConversation.js';
import { ok, fail } from '../utils/response.js';

export const conversationsRouter = Router();

function paramId(value: string | string[]): bigint | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

function parsePositiveInt(value: unknown, fallback: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

function truncateSummary(content: string, max = 255) {
  const trimmed = content.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}

async function assertConversationMember(conversationId: bigint, userId: bigint) {
  return prisma.conversationUser.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
}

/** 查找或创建两人私聊会话 */
async function ensurePrivateConversation(
  userId: bigint,
  targetUserId: bigint,
): Promise<bigint> {
  const existing = await prisma.conversation.findFirst({
    where: {
      type: 'private',
      AND: [
        { users: { some: { userId } } },
        { users: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      users: { select: { userId: true } },
    },
  });

  if (existing) {
    const ids = new Set(existing.users.map((u) => u.userId.toString()));
    if (ids.has(userId.toString()) && ids.has(targetUserId.toString())) {
      return existing.id;
    }
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { nickname: true },
  });
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true },
  });

  const conversation = await prisma.$transaction(async (tx) => {
    const created = await tx.conversation.create({
      data: {
        type: 'private',
        name: `${me?.nickname ?? '用户'}与${target?.nickname ?? '用户'}`,
      },
    });

    await tx.conversationUser.createMany({
      data: [
        { conversationId: created.id, userId, unreadCount: 0 },
        { conversationId: created.id, userId: targetUserId, unreadCount: 0 },
      ],
    });

    return created;
  });

  return conversation.id;
}

/** GET /conversations — 当前用户的会话列表 */
conversationsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    const conversations = await prisma.conversation.findMany({
      where: {
        users: { some: { userId } },
      },
      include: {
        users: {
          where: { userId },
          select: { unreadCount: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { aiTag: true },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
    });

    const list = conversations.map((c) => ({
      id: Number(c.id),
      type: c.type,
      name: c.name,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unreadCount: c.users[0]?.unreadCount ?? 0,
      aiTag: c.messages[0]?.aiTag ?? null,
      projectId: c.projectId != null ? Number(c.projectId) : null,
    }));

    res.json(ok({ list }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

/** POST /conversations — 创建或获取会话（联系发布人） */
conversationsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const body = req.body as {
      type?: string;
      projectId?: number | string;
      targetUserId?: number | string;
    };

    const type = body.type === 'private' ? 'private' : 'project';
    const projectId =
      body.projectId != null ? paramId(String(body.projectId)) : null;
    const targetUserId =
      body.targetUserId != null ? paramId(String(body.targetUserId)) : null;

    if (type === 'private') {
      if (!targetUserId) {
        res.status(400).json(fail(40001, '私聊需要 targetUserId'));
        return;
      }
      if (targetUserId === userId) {
        res.status(400).json(fail(40001, '不能与自己私聊'));
        return;
      }

      const target = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });
      if (!target) {
        res.status(404).json(fail(40401, '目标用户不存在'));
        return;
      }

      // 若带了 projectId，优先复用/创建该项目群，并把双方拉进群
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true, title: true, ownerId: true, isDraft: true },
        });
        if (!project || project.isDraft === 1) {
          res.status(404).json(fail(40401, '项目不存在'));
          return;
        }

        const conversationId = await prisma.$transaction(async (tx) => {
          return ensureProjectConversation(
            tx,
            projectId,
            [userId, targetUserId, project.ownerId],
            { name: `${project.title}小组` },
          );
        });

        res.json(ok({ conversationId: Number(conversationId) }));
        return;
      }

      const conversationId = await ensurePrivateConversation(
        userId,
        targetUserId,
      );
      res.json(ok({ conversationId: Number(conversationId) }));
      return;
    }

    // type === project
    if (!projectId) {
      res.status(400).json(fail(40001, '项目会话需要 projectId'));
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, ownerId: true, isDraft: true },
    });
    if (!project || project.isDraft === 1) {
      res.status(404).json(fail(40401, '项目不存在'));
      return;
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });
    const memberIds = [
      ...new Set([
        project.ownerId.toString(),
        userId.toString(),
        ...members.map((m) => m.userId.toString()),
      ]),
    ].map((id) => BigInt(id));

    const conversationId = await prisma.$transaction(async (tx) => {
      return ensureProjectConversation(tx, projectId, memberIds, {
        name: `${project.title}小组`,
      });
    });

    res.json(ok({ conversationId: Number(conversationId) }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

/** GET /conversations/:conversationId/messages — 历史消息 */
conversationsRouter.get(
  '/:conversationId/messages',
  requireAuth,
  async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const conversationId = paramId(req.params.conversationId);
      if (!conversationId) {
        res.status(400).json(fail(40001, '无效的会话 ID'));
        return;
      }

      const membership = await assertConversationMember(conversationId, userId);
      if (!membership) {
        res.status(403).json(fail(40301, '无权查看该会话'));
        return;
      }

      const page = parsePositiveInt(req.query.page, 1, 10_000);
      const pageSize = parsePositiveInt(req.query.pageSize, 20, 50);

      const [total, messages] = await Promise.all([
        prisma.message.count({ where: { conversationId } }),
        prisma.message.findMany({
          where: { conversationId },
          include: {
            sender: { select: { id: true, nickname: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      const list = messages.map((m) => ({
        id: Number(m.id),
        senderId: Number(m.senderId),
        senderNickname: m.sender.nickname,
        senderAvatar: m.sender.avatar,
        content: m.content,
        aiTag: m.aiTag,
        createdAt: m.createdAt,
      }));

      res.json(ok({ list, total, page, pageSize }));
    } catch (error) {
      console.error(error);
      res.status(500).json(fail(50001, '服务器错误'));
    }
  },
);

/** POST /conversations/:conversationId/messages — 发送消息 */
conversationsRouter.post(
  '/:conversationId/messages',
  requireAuth,
  async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const conversationId = paramId(req.params.conversationId);
      if (!conversationId) {
        res.status(400).json(fail(40001, '无效的会话 ID'));
        return;
      }

      const content =
        typeof req.body?.content === 'string' ? req.body.content.trim() : '';
      if (!content) {
        res.status(400).json(fail(40001, '消息内容不能为空'));
        return;
      }

      const membership = await assertConversationMember(conversationId, userId);
      if (!membership) {
        res.status(403).json(fail(40301, '无权在该会话发言'));
        return;
      }

      const message = await prisma.$transaction(async (tx) => {
        const created = await tx.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
          },
        });

        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessage: truncateSummary(content),
            lastMessageAt: created.createdAt,
          },
        });

        await tx.conversationUser.updateMany({
          where: {
            conversationId,
            userId: { not: userId },
          },
          data: {
            unreadCount: { increment: 1 },
          },
        });

        return created;
      });

      res.json(
        ok({
          id: Number(message.id),
          conversationId: Number(conversationId),
          content: message.content,
          createdAt: message.createdAt,
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(fail(50001, '服务器错误'));
    }
  },
);

/** POST /conversations/:conversationId/read — 标记已读 */
conversationsRouter.post(
  '/:conversationId/read',
  requireAuth,
  async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const conversationId = paramId(req.params.conversationId);
      if (!conversationId) {
        res.status(400).json(fail(40001, '无效的会话 ID'));
        return;
      }

      const membership = await assertConversationMember(conversationId, userId);
      if (!membership) {
        res.status(403).json(fail(40301, '无权操作该会话'));
        return;
      }

      await prisma.conversationUser.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: { unreadCount: 0 },
      });

      res.json(ok({ conversationId: Number(conversationId), unreadCount: 0 }));
    } catch (error) {
      console.error(error);
      res.status(500).json(fail(50001, '服务器错误'));
    }
  },
);

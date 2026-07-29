import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId, requireAuth } from '../middleware/auth.js';
import { ensureProjectConversation } from '../services/projectConversation.js';
import { ok, fail } from '../utils/response.js';

export const applicationsRouter = Router();

function paramId(value: string | string[]): bigint | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

applicationsRouter.post('/projects/:projectId/applications', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const projectId = paramId(req.params.projectId);
    if (!projectId) {
      res.status(400).json(fail(40001, '无效的项目 ID'));
      return;
    }
    const { roleName, message } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.isDraft === 1) {
      res.status(404).json(fail(40401, '项目不存在'));
      return;
    }
    if (project.ownerId === userId) {
      res.status(400).json(fail(40001, '不能申请自己发布的项目'));
      return;
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existingMember) {
      res.status(400).json(fail(40001, '您已是项目成员'));
      return;
    }

    const existingApp = await prisma.projectApplication.findFirst({
      where: { userId, projectId },
    });
    if (existingApp) {
      res.status(400).json(fail(40001, '您已经申请过该项目'));
      return;
    }

    const application = await prisma.projectApplication.create({
      data: { userId, projectId, roleName, message, status: 'pending' },
    });

    res.json(ok({ applicationId: Number(application.id) }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

applicationsRouter.get('/applications/mine', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const applications = await prisma.projectApplication.findMany({
      where: { userId },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });

    const list = applications.map((a) => ({
      ...a,
      id: Number(a.id),
      projectId: Number(a.projectId),
      userId: Number(a.userId),
      project: {
        ...a.project,
        id: Number(a.project.id),
        ownerId: Number(a.project.ownerId),
      },
    }));

    res.json(ok({ list }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

/** 发布者：收到的加入申请（跨项目） */
applicationsRouter.get('/applications/received', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const statusFilter =
      typeof req.query.status === 'string' ? req.query.status : undefined;

    const applications = await prisma.projectApplication.findMany({
      where: {
        project: { ownerId: userId },
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        project: {
          select: { id: true, title: true, cover: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const list = applications.map((a) => ({
      id: Number(a.id),
      projectId: Number(a.projectId),
      userId: Number(a.userId),
      roleName: a.roleName,
      message: a.message,
      status: a.status,
      matchScore: a.matchScore,
      matchReason: a.matchReason,
      createdAt: a.createdAt,
      user: { ...a.user, id: Number(a.user.id) },
      project: {
        id: Number(a.project.id),
        title: a.project.title,
        cover: a.project.cover,
        status: a.project.status,
      },
    }));

    res.json(ok({ list }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

applicationsRouter.get('/projects/:projectId/applications', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const projectId = paramId(req.params.projectId);
    if (!projectId) {
      res.status(400).json(fail(40001, '无效的项目 ID'));
      return;
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== userId) {
      res.status(403).json(fail(40301, '无权限查看此项目的申请'));
      return;
    }

    const applications = await prisma.projectApplication.findMany({
      where: { projectId },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const list = applications.map((a) => ({
      ...a,
      id: Number(a.id),
      projectId: Number(a.projectId),
      userId: Number(a.userId),
      user: { ...a.user, id: Number(a.user.id) },
    }));

    res.json(ok({ list }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

applicationsRouter.patch('/applications/:applicationId', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const applicationId = paramId(req.params.applicationId);
    if (!applicationId) {
      res.status(400).json(fail(40001, '无效的申请 ID'));
      return;
    }
    const { status } = req.body as { status?: string };

    if (status !== 'approved' && status !== 'rejected') {
      res.status(400).json(fail(40001, 'status 必须为 approved 或 rejected'));
      return;
    }

    const application = await prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: { project: true },
    });

    if (!application) {
      res.status(404).json(fail(40401, '申请不存在'));
      return;
    }
    if (application.project.ownerId !== userId) {
      res.status(403).json(fail(40301, '无审核权限'));
      return;
    }
    if (application.status !== 'pending') {
      res.status(400).json(fail(40001, '已处理过该申请'));
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectApplication.update({
        where: { id: applicationId },
        data: { status },
      });

      if (status === 'approved') {
        const existingMember = await tx.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: application.projectId,
              userId: application.userId,
            },
          },
        });

        if (!existingMember) {
          await tx.projectMember.create({
            data: {
              projectId: application.projectId,
              userId: application.userId,
              roleName: application.roleName || '成员',
            },
          });

          await tx.project.update({
            where: { id: application.projectId },
            data: { teamCurrent: { increment: 1 } },
          });
        }

        const members = await tx.projectMember.findMany({
          where: { projectId: application.projectId },
          select: { userId: true },
        });
        const memberIds = [
          ...new Set([
            application.project.ownerId.toString(),
            ...members.map((m) => m.userId.toString()),
          ]),
        ].map((id) => BigInt(id));

        await ensureProjectConversation(
          tx,
          application.projectId,
          memberIds,
          { name: `${application.project.title}小组` },
        );
      }
    });

    res.json(ok({ applicationId: Number(applicationId), status }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器内部错误'));
  }
});

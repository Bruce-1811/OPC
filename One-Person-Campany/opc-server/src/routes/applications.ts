import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId, requireAuth } from '../middleware/auth.js';
import { ok, fail } from '../utils/response.js';

export const applicationsRouter = Router();

applicationsRouter.post('/projects/:projectId/applications', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const projectId = BigInt(req.params.projectId as string);
    const { roleName, message } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json(fail(40401, '项目不存在'));
      return;
    }

    const existingApp = await prisma.projectApplication.findFirst({
      where: { userId, projectId }
    });
    if (existingApp) {
      res.status(400).json(fail(40001, '您已经申请过该项目'));
      return;
    }

    const application = await prisma.projectApplication.create({
      data: { userId, projectId, roleName, message, status: 'pending' }
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
      orderBy: { createdAt: 'desc' }
    });
    
    const list = applications.map((a: any) => ({
      ...a,
      id: Number(a.id),
      projectId: Number(a.projectId),
      userId: Number(a.userId),
      project: { ...a.project, id: Number(a.project.id), ownerId: Number(a.project.ownerId) }
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
    const projectId = BigInt(req.params.projectId as string);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== userId) {
      res.status(403).json(fail(40301, '无权限查看此项目的申请'));
      return;
    }

    const applications = await prisma.projectApplication.findMany({
      where: { projectId },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const list = applications.map((a: any) => ({
      ...a,
      id: Number(a.id),
      projectId: Number(a.projectId),
      userId: Number(a.userId),
      user: { ...a.user, id: Number(a.user.id) }
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
    const applicationId = BigInt(req.params.applicationId as string);
    const { status } = req.body;

    const application = await prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: { project: true }
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

    await prisma.$transaction(async (tx: any) => {
      await tx.projectApplication.update({
        where: { id: applicationId },
        data: { status }
      });

      if (status === 'approved') {
        await tx.projectMember.create({
          data: {
            projectId: application.projectId,
            userId: application.userId,
            roleName: application.roleName || '成员'
          }
        });
        
        await tx.project.update({
          where: { id: application.projectId },
          data: { teamCurrent: { increment: 1 } }
        });
      }
    });

    res.json(ok(null));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器内部错误'));
  }
});
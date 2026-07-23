import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// POST /api/projects/:projectId/applications - 提交加入申请
// 注意：这个路由带了 /projects/ 前缀，所以挂载时要在 index.ts 里特殊处理，或者把这块逻辑写进 projects.ts 里。
// 为了模块清晰，我们在这里定义，待会挂载到根路径。
router.post('/projects/:projectId/applications', async (req, res) => {
  try {
    const userId = BigInt((req as any).user.id);
    const projectId = BigInt(req.params.projectId);
    const { roleName, message } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.json({ code: 40401, message: '项目不存在', data: null });

    const existingApp = await prisma.projectApplication.findFirst({
      where: { userId, projectId }
    });
    if (existingApp) return res.json({ code: 40001, message: '您已经申请过该项目', data: null });

    const application = await prisma.projectApplication.create({
      data: { userId, projectId, roleName, message, status: 'pending' }
    });

    res.json({ code: 0, message: '申请提交成功', data: { applicationId: application.id.toString() } });
  } catch (error) {
    res.json({ code: 50001, message: '服务器错误', data: null });
  }
});

// GET /api/applications/mine - 查看我提交的申请
router.get('/applications/mine', async (req, res) => {
  try {
    const userId = BigInt((req as any).user.id);
    const applications = await prisma.projectApplication.findMany({
      where: { userId },
      include: { project: true },
      orderBy: { createdAt: 'desc' }
    });
    // 省略 BigInt 转字符串细节，同上
    res.json({ code: 0, message: 'ok', data: { list: applications } });
  } catch (error) {
    res.json({ code: 50001, message: '服务器错误', data: null });
  }
});

// GET /api/projects/:projectId/applications - 发布者查看申请
router.get('/projects/:projectId/applications', async (req, res) => {
  try {
    const userId = BigInt((req as any).user.id);
    const projectId = BigInt(req.params.projectId);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== userId) {
      return res.json({ code: 40301, message: '无权限查看此项目的申请', data: null });
    }

    const applications = await prisma.projectApplication.findMany({
      where: { projectId },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ code: 0, message: 'ok', data: { list: applications } });
  } catch (error) {
    res.json({ code: 50001, message: '服务器错误', data: null });
  }
});

// PATCH /api/applications/:applicationId - 发布者审核申请
router.patch('/applications/:applicationId', async (req, res) => {
  try {
    const userId = BigInt((req as any).user.id);
    const applicationId = BigInt(req.params.applicationId);
    const { status } = req.body;

    const application = await prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: { project: true }
    });

    if (!application) return res.json({ code: 40401, message: '申请不存在', data: null });
    if (application.project.ownerId !== userId) return res.json({ code: 40301, message: '无审核权限', data: null });
    if (application.status !== 'pending') return res.json({ code: 40001, message: '已处理过该申请', data: null });

    await prisma.$transaction(async (tx) => {
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

    res.json({ code: 0, message: `已成功${status === 'approved' ? '通过' : '拒绝'}`, data: null });
  } catch (error) {
    console.error(error);
    res.json({ code: 50001, message: '服务器内部错误', data: null });
  }
});

export default router;
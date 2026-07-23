import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId, requireAuth } from '../middleware/auth.js';
import { ok, fail } from '../utils/response.js';

export const tasksRouter = Router();

// POST /api/projects/:projectId/tasks - 在项目中创建任务
tasksRouter.post('/projects/:projectId/tasks', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req); 
    const projectId = BigInt(req.params.projectId);
    const { title, assigneeId, priority, dueDate } = req.body;

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } }
    });
    if (!member) {
      res.status(403).json(fail(40301, '无权限，只有项目成员才能创建任务'));
      return;
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId,
        title,
        assigneeId: assigneeId ? BigInt(assigneeId) : null,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'todo' 
      }
    });

    res.json(ok({ taskId: Number(task.id) }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

// GET /api/projects/:projectId/tasks - 获取某项目下的任务列表
tasksRouter.get('/projects/:projectId/tasks', requireAuth, async (req, res) => {
  try {
    const projectId = BigInt(req.params.projectId);
    const { status } = req.query;

    const whereClause: any = { projectId };
    if (status) whereClause.status = status as string;

    const tasks = await prisma.projectTask.findMany({
      where: whereClause,
      include: { assignee: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const list = tasks.map(t => ({
      ...t,
      id: Number(t.id),
      projectId: Number(t.projectId),
      assigneeId: t.assigneeId ? Number(t.assigneeId) : null,
      assignee: t.assignee ? { ...t.assignee, id: Number(t.assignee.id) } : null
    }));

    res.json(ok({ list }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

// GET /api/tasks/mine - 获取我的跨项目待办
tasksRouter.get('/tasks/mine', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { status } = req.query;

    const whereClause: any = { assigneeId: userId };
    if (status) whereClause.status = status as string;

    const tasks = await prisma.projectTask.findMany({
      where: whereClause,
      include: { project: { select: { id: true, title: true } } },
      orderBy: { dueDate: 'asc' } 
    });

    const list = tasks.map(t => ({
      ...t,
      id: Number(t.id),
      projectId: Number(t.projectId),
      assigneeId: t.assigneeId ? Number(t.assigneeId) : null,
      project: { ...t.project, id: Number(t.project.id) }
    }));

    res.json(ok({ list }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

// PATCH /api/tasks/:taskId - 更新任务状态
tasksRouter.patch('/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const taskId = BigInt(req.params.taskId);
    const { status, priority } = req.body;

    await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        ...(status && { status }),
        ...(priority && { priority })
      }
    });

    res.json(ok(null));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});
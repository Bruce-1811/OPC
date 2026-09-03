import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import {
  getAuthUserId,
  optionalAuth,
  requireAuth,
} from '../middleware/auth.js';
import { publishProjectRecord } from '../services/projectMutations.js';
import {
  buildProjectDetail,
  buildProjectListWhere,
  computeMatchForUser,
} from '../services/projectQueries.js';
import { fail, ok } from '../utils/response.js';
import {
  buildCreateProjectData,
  buildUpdateProjectData,
} from '../utils/projectBody.js';
import {
  toDraftListItem,
  toProjectListItem,
} from '../utils/projectDto.js';

export const projectsRouter = Router();

function parsePositiveInt(value: unknown, fallback: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

function parseProjectId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

projectsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const body = req.body as Record<string, unknown>;

    const isDraft = body.isDraft !== false;
    const data = buildCreateProjectData(body, ownerId, isDraft);

    if (!isDraft && !data.title) {
      res.status(400).json(fail(40001, '发布项目请填写标题'));
      return;
    }

    if (!isDraft) {
      const project = await prisma.$transaction(async (tx: any) => {
        const created = await tx.project.create({ data });
        await publishProjectRecord(tx, created.id, ownerId, created.teamCurrent);
        return created;
      });

      const detail = await buildProjectDetail(project.id, ownerId);
      res.json(
        ok({
          projectId: Number(project.id),
          ...detail,
        }),
      );
      return;
    }

    const project = await prisma.project.create({ data });
    res.json(
      ok({
        projectId: Number(project.id),
        id: Number(project.id),
        title: project.title,
        isDraft: true,
        status: project.status,
      }),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

projectsRouter.get('/drafts', requireAuth, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const pageSize = parsePositiveInt(req.query.pageSize, 10, 50);

    const where: any = {
      ownerId,
      isDraft: 1,
    };

    const [total, rows] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json(
      ok({
        list: rows.map(toDraftListItem),
        total,
        page,
        pageSize,
      }),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

projectsRouter.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const pageSize = parsePositiveInt(req.query.pageSize, 10, 50);
    const keyword =
      typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
    const sort = req.query.sort === 'hot' ? 'hot' : 'latest';

    const where = buildProjectListWhere({ keyword, tag });
    const orderBy: any = 
      sort === 'hot'
        ? { viewCount: 'desc' }
        : { createdAt: 'desc' };

    const viewerId = req.auth?.userId ? BigInt(req.auth.userId) : undefined;

    const [total, rows] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    let favoriteSet = new Set<string>();
    if (viewerId && rows.length > 0) {
      const favorites = await prisma.userFavorite.findMany({
        where: {
          userId: viewerId,
          projectId: { in: rows.map((r: any) => r.id) },
        },
        select: { projectId: true },
      });
      favoriteSet = new Set(favorites.map((f: any) => f.projectId.toString()));
    }

    const list = await Promise.all(
     rows.map(async (project: any) => {
        const extras: {
          isFavorite?: boolean;
          matchScore?: number;
          matchReason?: string;
        } = {
          isFavorite: viewerId
            ? favoriteSet.has(project.id.toString())
            : false,
        };

        if (viewerId) {
          const match = await computeMatchForUser(viewerId, project.tags);
          if (match) {
            extras.matchScore = match.matchScore;
            extras.matchReason = match.matchReason;
          }
        }

        return toProjectListItem(project, extras);
      }),
    );

    res.json(ok({ list, total, page, pageSize }));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

projectsRouter.put('/:projectId', requireAuth, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const idParam = req.params.projectId;
    const projectId = parseProjectId(
      Array.isArray(idParam) ? idParam[0] : idParam,
    );
    if (!projectId) {
      res.status(400).json(fail(40001, '无效的项目 ID'));
      return;
    }

    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!existing || existing.ownerId !== ownerId) {
      res.status(404).json(fail(40401, '项目不存在或无权编辑'));
      return;
    }

    const body = req.body as Record<string, unknown>;
    const willPublish = body.isDraft === false;
    const wasDraft = existing.isDraft === 1;

    if (willPublish) {
      const title =
        typeof body.title === 'string'
          ? body.title.trim()
          : existing.title.trim();
      if (!title || title === '未命名草稿') {
        res.status(400).json(fail(40001, '发布项目请填写标题'));
        return;
      }
    }

    const updateData = buildUpdateProjectData(body);

    if (body.isDraft === true) {
      updateData.isDraft = 1;
      updateData.status = 'draft';
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.project.update({
        where: { id: projectId },
        data: updateData,
      });

      if (wasDraft && willPublish) {
        await publishProjectRecord(
          tx,
          projectId,
          ownerId,
          existing.teamCurrent,
        );
      }
    });

    const detail = await buildProjectDetail(projectId, ownerId);
    res.json(ok(detail));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

// 我参与的项目列表（须注册在 /:projectId 之前）
projectsRouter.get('/mine', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { status } = req.query; 

    const whereClause: any = {
      members: { some: { userId } }
    };
    if (typeof status === 'string') {
      whereClause.status = status;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        tasks: true,
        owner: { select: { nickname: true, avatar: true } },
        members: { include: { user: { select: { avatar: true } } } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const list = projects.map((p: any) => ({
      ...p,
      id: Number(p.id),
      ownerId: Number(p.ownerId),
      // 处理 tasks 里的 BigInt 防止 JSON 序列化报错
      tasks: p.tasks.map((t: any) => ({
        ...t,
        id: Number(t.id),
        projectId: Number(t.projectId),
        assigneeId: t.assigneeId ? Number(t.assigneeId) : null,
      })),
      members: p.members.map((m: any) => ({ ...m, id: Number(m.id), userId: Number(m.userId) }))
    }));

    res.json(ok({ list }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

projectsRouter.get('/:projectId', optionalAuth, async (req, res) => {
  try {
    const idParam = req.params.projectId;
    const projectId = parseProjectId(
      Array.isArray(idParam) ? idParam[0] : idParam,
    );
    if (!projectId) {
      res.status(400).json(fail(40001, '无效的项目 ID'));
      return;
    }

    const viewerId = req.auth?.userId ? BigInt(req.auth.userId) : undefined;

    await prisma.project.updateMany({
      where: { id: projectId, isDraft: 0 },
      data: { viewCount: { increment: 1 } },
    });

    const detail = await buildProjectDetail(projectId, viewerId);
    if (!detail) {
      res.status(404).json(fail(40401, '项目不存在'));
      return;
    }

    res.json(ok(detail));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

projectsRouter.patch('/:projectId', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const idParam = req.params.projectId;
    const projectId = parseProjectId(
      Array.isArray(idParam) ? idParam[0] : idParam,
    );
    
    if (!projectId) {
      res.status(400).json(fail(40001, '无效的项目 ID'));
      return;
    }

    const { progress, status } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json(fail(40401, '项目不存在'));
      return;
    }
    
    if (project.ownerId !== userId) {
      res.status(403).json(fail(40301, '无权限修改项目信息'));
      return;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(progress !== undefined && { progress }),
        ...(status && { status })
      }
    });

    res.json(ok(null));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

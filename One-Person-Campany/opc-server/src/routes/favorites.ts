import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId, requireAuth } from '../middleware/auth.js';
import { ok, fail } from '../utils/response.js';

export const favoritesRouter = Router();

function paramId(value: string | string[]): bigint | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

favoritesRouter.post('/:projectId', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const projectId = paramId(req.params.projectId);
    if (!projectId) {
      res.status(400).json(fail(40001, '无效的项目 ID'));
      return;
    }

    const existing = await prisma.userFavorite.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (existing) {
      res.status(400).json(fail(40001, '您已经收藏过该项目了'));
      return;
    }

    const favorite = await prisma.userFavorite.create({
      data: { userId, projectId },
    });

    res.json(ok({ id: Number(favorite.id) }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

favoritesRouter.delete('/:projectId', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const projectId = paramId(req.params.projectId);
    if (!projectId) {
      res.status(400).json(fail(40001, '无效的项目 ID'));
      return;
    }

    await prisma.userFavorite.delete({
      where: { userId_projectId: { userId, projectId } },
    });

    res.json(ok(null));
  } catch {
    res.json(ok(null));
  }
});

favoritesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });

    const list = favorites.map((f) => ({
      ...f,
      id: Number(f.id),
      userId: Number(f.userId),
      projectId: Number(f.projectId),
      project: {
        ...f.project,
        id: Number(f.project.id),
        ownerId: Number(f.project.ownerId),
      },
    }));

    res.json(ok({ list }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId, requireAuth } from '../middleware/auth.js';
import { ok, fail } from '../utils/response.js';

export const favoritesRouter = Router();

favoritesRouter.post('/:projectId', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const projectId = BigInt(req.params.projectId as string)

    const existing = await prisma.userFavorite.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });

    if (existing) {
      res.status(400).json(fail(40001, '您已经收藏过该项目了'));
      return;
    }

    const favorite = await prisma.userFavorite.create({
      data: { userId, projectId }
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
    const projectId = BigInt(req.params.projectId as string);

    await prisma.userFavorite.delete({
      where: { userId_projectId: { userId, projectId } }
    });

    res.json(ok(null));
  } catch (error) {
    res.json(ok(null));
  }
});

favoritesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    
    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      include: { project: true },
      orderBy: { createdAt: 'desc' }
    });

    const list = favorites.map((f: any) => ({
      ...f,
      id: Number(f.id),
      userId: Number(f.userId),
      projectId: Number(f.projectId),
      project: { ...f.project, id: Number(f.project.id), ownerId: Number(f.project.ownerId) }
    }));

    res.json(ok({ list }));
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});
import { Router } from 'express';
// 按照您的目录结构，从 lib 引入 prisma 实例
import { prisma } from '../lib/prisma.js';
// 假设您的 auth 中间件在这里（根据您的实际文件名调整）
// import { requireAuth } from '../middleware/auth'; 

const router = Router();

// 建议：在这里全局应用鉴权中间件
// router.use(requireAuth);

// POST /api/favorites/:projectId - 收藏项目
router.post('/:projectId', async (req, res) => {
  try {
    const userId = BigInt((req as any).user.id);
    const projectId = BigInt(req.params.projectId);

    const existing = await prisma.userFavorite.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });

    if (existing) {
      return res.json({ code: 40001, message: '您已经收藏过该项目了', data: null });
    }

    const favorite = await prisma.userFavorite.create({
      data: { userId, projectId }
    });

    res.json({ code: 0, message: '收藏成功', data: { id: favorite.id.toString() } });
  } catch (error) {
    console.error(error);
    res.json({ code: 50001, message: '服务器错误', data: null });
  }
});

// DELETE /api/favorites/:projectId - 取消收藏
router.delete('/:projectId', async (req, res) => {
  try {
    const userId = BigInt((req as any).user.id);
    const projectId = BigInt(req.params.projectId);

    await prisma.userFavorite.delete({
      where: { userId_projectId: { userId, projectId } }
    });

    res.json({ code: 0, message: '已取消收藏', data: null });
  } catch (error) {
    res.json({ code: 0, message: '已取消收藏', data: null });
  }
});

// GET /api/favorites - 获取我的收藏列表
router.get('/', async (req, res) => {
  try {
    const userId = BigInt((req as any).user.id);
    
    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      include: { project: true },
      orderBy: { createdAt: 'desc' }
    });

    // 转换 BigInt 避免 JSON 序列化报错
    const list = favorites.map(f => ({
      ...f,
      id: f.id.toString(),
      userId: f.userId.toString(),
      projectId: f.projectId.toString(),
      project: { ...f.project, id: f.project.id.toString(), ownerId: f.project.ownerId.toString() }
    }));

    res.json({ code: 0, message: 'ok', data: { list } });
  } catch (error) {
    console.error(error);
    res.json({ code: 50001, message: '服务器错误', data: null });
  }
});

export default router;
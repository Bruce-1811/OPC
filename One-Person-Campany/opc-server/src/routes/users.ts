import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, getAuthUserId } from '../middleware/auth.js';
import { loadUserProfile } from '../services/userProfile.js';
import { fail, ok } from '../utils/response.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.put('/me', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { nickname, avatar, bio } = req.body as {
      nickname?: string;
      avatar?: string | null;
      bio?: string | null;
    };

    if (!nickname?.trim()) {
      res.status(400).json(fail(40001, '昵称不能为空'));
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        nickname: nickname.trim(),
        avatar: avatar ?? null,
        bio: bio ?? null,
      },
    });

    const profile = await loadUserProfile(userId);
    res.json(ok(profile));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

usersRouter.get('/me/skills', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const skills = await prisma.userSkill.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
    res.json(ok(skills.map((s) => s.skillName)));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

usersRouter.put('/me/skills', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { skills } = req.body as { skills?: string[] };

    if (!Array.isArray(skills)) {
      res.status(400).json(fail(40001, 'skills 必须是数组'));
      return;
    }

    const normalized = [
      ...new Set(
        skills.map((s) => s.trim()).filter(Boolean),
      ),
    ].slice(0, 20);

    await prisma.$transaction([
      prisma.userSkill.deleteMany({ where: { userId } }),
      ...normalized.map((skillName) =>
        prisma.userSkill.create({ data: { userId, skillName } }),
      ),
    ]);

    res.json(ok(normalized));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

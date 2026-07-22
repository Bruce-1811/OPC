import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireAuth, signToken, getAuthUserId } from '../middleware/auth.js';
import { loadUserProfile } from '../services/userProfile.js';
import { fail, ok } from '../utils/response.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body as {
      phone?: string;
      password?: string;
      nickname?: string;
    };

    if (!phone?.trim() || !password || !nickname?.trim()) {
      res.status(400).json(fail(40001, '请填写手机号、密码和昵称'));
      return;
    }

    if (password.length < 6) {
      res.status(400).json(fail(40001, '密码至少 6 位'));
      return;
    }

    const exists = await prisma.user.findUnique({ where: { phone: phone.trim() } });
    if (exists) {
      res.status(400).json(fail(40001, '手机号已注册'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        phone: phone.trim(),
        password: passwordHash,
        nickname: nickname.trim(),
      },
    });

    const profile = await loadUserProfile(user.id);
    const token = signToken(user.id);

    res.json(
      ok({
        token,
        user: profile,
      }),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body as {
      phone?: string;
      password?: string;
    };

    if (!phone?.trim() || !password) {
      res.status(400).json(fail(40001, '请填写手机号和密码'));
      return;
    }

    const user = await prisma.user.findUnique({ where: { phone: phone.trim() } });
    if (!user) {
      res.status(400).json(fail(40001, '手机号或密码错误'));
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(400).json(fail(40001, '手机号或密码错误'));
      return;
    }

    const profile = await loadUserProfile(user.id);
    const token = signToken(user.id);

    res.json(
      ok({
        token,
        user: profile,
      }),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const profile = await loadUserProfile(userId);
    if (!profile) {
      res.status(404).json(fail(40401, '用户不存在'));
      return;
    }
    res.json(ok(profile));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

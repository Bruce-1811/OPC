import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId, requireAuth } from '../middleware/auth.js';
import { ok, fail } from '../utils/response.js';

export const aiRouter = Router();

function parsePositiveInt(value: unknown, fallback: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

function getAiServiceBaseUrl() {
  return (
    process.env.AI_SERVICE_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000'
  );
}

type AiServiceChatResponse = {
  reply?: string;
  detail?: string;
};

async function callPythonChat(content: string): Promise<string> {
  const base = getAiServiceBaseUrl();
  const url = `${base}/api/ai/chat`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content }],
      stream: false,
    }),
  });

  const text = await response.text();
  let data: AiServiceChatResponse = {};
  try {
    data = JSON.parse(text) as AiServiceChatResponse;
  } catch {
    throw new Error(
      `AI 服务返回非 JSON（HTTP ${response.status}）: ${text.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data.detail || `AI 服务错误（HTTP ${response.status}）`,
    );
  }

  const reply = data.reply?.trim();
  if (!reply) {
    throw new Error('AI 服务未返回 reply');
  }
  return reply;
}

function toMessageDto(row: {
  id: bigint;
  role: string;
  content: string;
  createdAt: Date;
}) {
  return {
    id: Number(row.id),
    role: row.role,
    content: row.content,
    createdAt: row.createdAt,
  };
}

/** POST /ai/chat — 前端提问，Express 转发 Python 大模型 */
aiRouter.post('/chat', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const content =
      typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!content) {
      res.status(400).json(fail(40001, '问题内容不能为空'));
      return;
    }

    let reply: string;
    try {
      reply = await callPythonChat(content);
    } catch (err) {
      console.error('[ai] callPythonChat failed:', err);
      const message =
        err instanceof Error ? err.message : '调用 AI 服务失败';
      res.status(502).json(fail(50201, message));
      return;
    }

    const [userRow, assistantRow] = await prisma.$transaction([
      prisma.aiChat.create({
        data: { userId, role: 'user', content },
      }),
      prisma.aiChat.create({
        data: { userId, role: 'assistant', content: reply },
      }),
    ]);

    res.json(
      ok({
        reply,
        suggestions: [],
        userMessage: toMessageDto(userRow),
        assistantMessage: toMessageDto(assistantRow),
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

/** GET /ai/chat/history — 对话历史 */
aiRouter.get('/chat/history', requireAuth, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const pageSize = parsePositiveInt(req.query.pageSize, 50, 100);

    const where = { userId };
    const [total, rows] = await Promise.all([
      prisma.aiChat.count({ where }),
      prisma.aiChat.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json(
      ok({
        list: rows.map(toMessageDto),
        total,
        page,
        pageSize,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(fail(50001, '服务器错误'));
  }
});

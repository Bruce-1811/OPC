// opc-server/src/routes/tasks.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth'; // 请根据您的实际路径调整

const router = express.Router();
const prisma = new PrismaClient();

// 1. 创建新任务
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { projectId, title, assigneeId, priority } = req.body;
    
    const newTask = await prisma.projectTask.create({
      data: {
        projectId: BigInt(projectId),
        title,
        assigneeId: assigneeId ? BigInt(assigneeId) : null,
        priority: priority || 'medium',
        status: 'todo'
      }
    });
    
    // Prisma 的 BigInt 在转 JSON 时会报错，需要手动转成 String
    const responseData = {
      ...newTask,
      id: newTask.id.toString(),
      projectId: newTask.projectId.toString(),
      assigneeId: newTask.assigneeId?.toString()
    };
    
    res.json({ code: 0, data: responseData, message: '创建成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '创建任务失败' });
  }
});

// 2. 更新任务状态 (前端点击复选框打勾时调用)
router.patch('/:id', authMiddleware, async (req: any, res) => {
  try {
    const taskId = BigInt(req.params.id);
    const { status, title } = req.body; // 可以传状态（'done'）或者修改标题
    
    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: { 
        ...(status && { status }),
        ...(title && { title })
      }
    });
    
    res.json({ code: 0, message: '更新成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

// 3. 删除任务
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    await prisma.projectTask.delete({
      where: { id: BigInt(req.params.id) }
    });
    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

export default router;
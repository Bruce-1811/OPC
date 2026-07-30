// src/api/tasks.ts
import { http, type ApiResponse } from './client';

// 创建任务的参数规范
export interface CreateTaskParams {
  projectId: number;
  title: string;
  assigneeId?: number;
  priority?: string; // 例如: 'high', 'medium', 'low'
}

// 更新任务的参数规范
export interface UpdateTaskParams {
  title?: string;
  status?: string; // 例如: 'todo', 'done'
}

/**
 * 1. 创建新任务
 */
export async function createTask(data: CreateTaskParams): Promise<ApiResponse<any>> {
  return http.post('/tasks', data);
}

/**
 * 2. 更新任务状态或标题
 */
export async function updateTask(taskId: number, data: UpdateTaskParams): Promise<ApiResponse<any>> {
  return http.patch(`/tasks/${taskId}`, data);
}

/**
 * 3. 删除任务
 */
export async function deleteTask(taskId: number): Promise<ApiResponse<any>> {
  return http.delete(`/tasks/${taskId}`);
}
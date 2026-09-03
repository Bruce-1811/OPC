import { http, type ApiResponse } from './client';

export interface CreateTaskParams {
  projectId: number;
  title: string;
  assigneeId?: number;
  priority?: string;
}

export interface UpdateTaskParams {
  title?: string;
  status?: string;
}

export async function createTask(
  data: CreateTaskParams,
): Promise<ApiResponse<unknown>> {
  return http.post(`/projects/${data.projectId}/tasks`, {
    title: data.title,
    assigneeId: data.assigneeId,
    priority: data.priority,
  });
}

export async function updateTask(
  taskId: number,
  data: UpdateTaskParams,
): Promise<ApiResponse<unknown>> {
  return http.patch(`/tasks/${taskId}`, data);
}

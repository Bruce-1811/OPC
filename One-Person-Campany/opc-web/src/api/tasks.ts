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

export async function createTask(data: CreateTaskParams) {
  const { data: body } = await http.post<ApiResponse<unknown>>(
    `/projects/${data.projectId}/tasks`,
    {
      title: data.title,
      assigneeId: data.assigneeId,
      priority: data.priority,
    },
  );
  return body;
}

export async function updateTask(taskId: number, data: UpdateTaskParams) {
  const { data: body } = await http.patch<ApiResponse<unknown>>(
    `/tasks/${taskId}`,
    data,
  );
  return body;
}

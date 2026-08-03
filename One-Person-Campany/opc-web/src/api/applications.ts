import { http, type ApiResponse } from './client';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ApplicationProject {
  id: number;
  title: string;
  cover: string | null;
  status: string;
  ownerId?: number;
}

export interface MyApplicationItem {
  id: number;
  projectId: number;
  userId: number;
  roleName: string | null;
  message: string | null;
  status: ApplicationStatus;
  matchScore: number | null;
  matchReason: string | null;
  createdAt: string;
  project: ApplicationProject;
}

export interface ProjectApplicationUser {
  id: number;
  nickname: string;
  avatar: string | null;
}

export interface ProjectApplicationItem {
  id: number;
  projectId: number;
  userId: number;
  roleName: string | null;
  message: string | null;
  status: ApplicationStatus;
  matchScore: number | null;
  matchReason: string | null;
  createdAt: string;
  user: ProjectApplicationUser;
  project?: ApplicationProject;
}

export async function submitApplication(
  projectId: number,
  payload: { roleName?: string; message?: string },
) {
  const { data } = await http.post<
    ApiResponse<{ applicationId: number; status?: string }>
  >(`/projects/${projectId}/applications`, payload);
  return data;
}

export async function fetchMyApplications() {
  const { data } = await http.get<ApiResponse<{ list: MyApplicationItem[] }>>(
    '/applications/mine',
  );
  return data;
}

/** 发布者收到的申请（可跨项目） */
export async function fetchReceivedApplications(status?: ApplicationStatus) {
  const { data } = await http.get<
    ApiResponse<{ list: ProjectApplicationItem[] }>
  >('/applications/received', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function fetchProjectApplications(projectId: number) {
  const { data } = await http.get<
    ApiResponse<{ list: ProjectApplicationItem[] }>
  >(`/projects/${projectId}/applications`);
  return data;
}

export async function reviewApplication(
  applicationId: number,
  status: 'approved' | 'rejected',
) {
  const { data } = await http.patch<
    ApiResponse<{ applicationId: number; status: string } | null>
  >(`/applications/${applicationId}`, { status });
  return data;
}

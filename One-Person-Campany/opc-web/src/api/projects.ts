import { http, type ApiResponse } from './client';

export interface ProjectListItem {
  id: number;
  title: string;
  cover: string | null;
  tags: string[];
  status: string;
  teamCurrent: number;
  teamMax: number;
  deadline: string | null;
  viewCount: number;
  heatScore: number;
  isFavorite: boolean;
  matchScore?: number;
  matchReason?: string;
}

export interface ProjectListData {
  list: ProjectListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProjectDetail {
  id: number;
  title: string;
  description: string | null;
  cover: string | null;
  tags: string[];
  status: string;
  workMode: string | null;
  durationWeeks: number | null;
  deadline: string | null;
  teamCurrent: number;
  teamMax: number;
  progress: number;
  roles: { name: string; count?: number; filled?: number }[];
  phases: { name: string; status?: string }[];
  aiSummary: string | null;
  owner: { id: number; nickname: string; avatar: string | null };
  members: {
    userId: number;
    nickname: string;
    avatar: string | null;
    roleName: string;
  }[];
  isFavorite: boolean;
  hasApplied: boolean;
  isDraft?: boolean;
}

export interface DraftListItem {
  id: number;
  title: string;
  tags: string[];
  updatedAt: string;
}

export type FetchProjectsParams = {
  keyword?: string;
  tag?: string;
  sort?: 'latest' | 'hot';
  page?: number;
  pageSize?: number;
};

export async function fetchProjects(params: FetchProjectsParams = {}) {
  const { data } = await http.get<ApiResponse<ProjectListData>>('/projects', {
    params,
  });
  return data;
}

export async function fetchProjectDetail(projectId: number) {
  const { data } = await http.get<ApiResponse<ProjectDetail>>(`/projects/${projectId}`);
  return data;
}

export type CreateProjectPayload = {
  title?: string;
  description?: string;
  rawInput?: string;
  tags?: string;
  cover?: string;
  workMode?: string;
  durationWeeks?: number;
  deadline?: string;
  teamMax?: number;
  roles?: { name: string; count?: number; filled?: number }[];
  phases?: { name: string; status?: string }[];
  isDraft?: boolean;
};

export type UpdateProjectPayload = CreateProjectPayload;

export async function createProject(payload: CreateProjectPayload) {
  const { data } = await http.post<
    ApiResponse<ProjectDetail & { projectId: number; isDraft?: boolean }>
  >('/projects', payload);
  return data;
}

export async function updateProject(projectId: number, payload: UpdateProjectPayload) {
  const { data } = await http.put<ApiResponse<ProjectDetail>>(
    `/projects/${projectId}`,
    payload,
  );
  return data;
}

export async function fetchDrafts(page = 1, pageSize = 20) {
  const { data } = await http.get<ApiResponse<{ list: DraftListItem[]; total: number }>>(
    '/projects/drafts',
    { params: { page, pageSize } },
  );
  return data;
}

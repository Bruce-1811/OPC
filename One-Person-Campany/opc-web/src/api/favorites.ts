import { http, type ApiResponse } from './client';

export interface FavoriteProject {
  id: number;
  title: string;
  cover: string | null;
  tags: string | null;
  status: string;
  teamCurrent: number;
  teamMax: number;
  deadline: string | null;
  viewCount: number;
  ownerId: number;
}

export interface FavoriteItem {
  id: number;
  userId: number;
  projectId: number;
  createdAt: string;
  project: FavoriteProject;
}

export async function addFavorite(projectId: number) {
  const { data } = await http.post<ApiResponse<{ id: number }>>(
    `/favorites/${projectId}`,
  );
  return data;
}

export async function removeFavorite(projectId: number) {
  const { data } = await http.delete<ApiResponse<null>>(
    `/favorites/${projectId}`,
  );
  return data;
}

export async function fetchFavorites() {
  const { data } = await http.get<ApiResponse<{ list: FavoriteItem[] }>>(
    '/favorites',
  );
  return data;
}

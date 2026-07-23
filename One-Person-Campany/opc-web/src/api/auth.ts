import { http, type ApiResponse } from './client';

export interface UserProfile {
  id: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  skills: string[];
  stats: {
    projectsJoined: number;
    applicationsPending: number;
    applicationsToReview: number;
  };
}

export interface AuthResult {
  token: string;
  user: UserProfile;
}

export async function register(payload: {
  phone: string;
  password: string;
  nickname: string;
}) {
  const { data } = await http.post<ApiResponse<AuthResult>>('/auth/register', payload);
  return data;
}

export async function login(payload: { phone: string; password: string }) {
  const { data } = await http.post<ApiResponse<AuthResult>>('/auth/login', payload);
  return data;
}

export async function fetchMe() {
  const { data } = await http.get<ApiResponse<UserProfile>>('/auth/me');
  return data;
}

export async function updateProfile(payload: {
  nickname: string;
  avatar?: string | null;
  bio?: string | null;
}) {
  const { data } = await http.put<ApiResponse<UserProfile>>('/users/me', payload);
  return data;
}

export async function updateSkills(skills: string[]) {
  const { data } = await http.put<ApiResponse<string[]>>('/users/me/skills', { skills });
  return data;
}

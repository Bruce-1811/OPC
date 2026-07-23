import { http } from './client';

// 收藏项目
export function addFavorite(projectId: number | string) {
  return http.post(`/favorites/${projectId}`);
}

// 取消收藏项目
export function removeFavorite(projectId: number | string) {
  return http.delete(`/favorites/${projectId}`);
}

// 获取我的收藏列表
export function getMyFavorites() {
  return http.get('/favorites');
}
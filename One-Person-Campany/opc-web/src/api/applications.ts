import { http } from './client';

// 申请加入项目
export function applyForProject(projectId: number | string, data: { roleName: string; message: string }) {
  return http.post(`/projects/${projectId}/applications`, data);
}

// 获取我发出的申请记录
export function getMyApplications() {
  return http.get('/applications/mine');
}

// 获取某个项目收到的所有申请（仅项目 Owner 可用）
export function getProjectApplications(projectId: number | string) {
  return http.get(`/projects/${projectId}/applications`);
}

// 审核申请（通过或拒绝）
export function reviewApplication(applicationId: number | string, status: 'approved' | 'rejected') {
  return http.patch(`/applications/${applicationId}`, { status });
}
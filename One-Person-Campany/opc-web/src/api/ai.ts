import { http, type ApiResponse } from './client';

export type AiRole = 'user' | 'assistant';

export interface AiChatMessage {
  id: number;
  role: AiRole;
  content: string;
  createdAt: string;
}

export interface AiSuggestion {
  type: string;
  refId: number;
  title: string;
}

export interface AiChatResult {
  reply: string;
  suggestions: AiSuggestion[];
  userMessage?: AiChatMessage;
  assistantMessage?: AiChatMessage;
}

export async function sendAiChat(content: string) {
  const { data } = await http.post<ApiResponse<AiChatResult>>('/ai/chat', {
    content,
  });
  return data;
}

export async function fetchAiHistory(page = 1, pageSize = 50) {
  const { data } = await http.get<
    ApiResponse<{
      list: AiChatMessage[];
      total: number;
      page: number;
      pageSize: number;
    }>
  >('/ai/chat/history', {
    params: { page, pageSize },
  });
  return data;
}

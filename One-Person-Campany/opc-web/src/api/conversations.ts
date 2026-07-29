import { http, type ApiResponse } from './client';

export interface ConversationItem {
  id: number;
  type: string;
  name: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  aiTag: string | null;
  projectId: number | null;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  senderNickname: string;
  senderAvatar: string | null;
  content: string;
  aiTag: string | null;
  createdAt: string;
}

export async function fetchConversations() {
  const { data } = await http.get<
    ApiResponse<{ list: ConversationItem[] }>
  >('/conversations');
  return data;
}

export async function fetchMessages(
  conversationId: number,
  page = 1,
  pageSize = 50,
) {
  const { data } = await http.get<
    ApiResponse<{
      list: ChatMessage[];
      total: number;
      page: number;
      pageSize: number;
    }>
  >(`/conversations/${conversationId}/messages`, {
    params: { page, pageSize },
  });
  return data;
}

export async function sendMessage(conversationId: number, content: string) {
  const { data } = await http.post<
    ApiResponse<{
      id: number;
      conversationId: number;
      content: string;
      createdAt: string;
    }>
  >(`/conversations/${conversationId}/messages`, { content });
  return data;
}

export async function markConversationRead(conversationId: number) {
  const { data } = await http.post<
    ApiResponse<{ conversationId: number; unreadCount: number }>
  >(`/conversations/${conversationId}/read`);
  return data;
}

export async function openConversation(payload: {
  type?: 'project' | 'private';
  projectId?: number;
  targetUserId?: number;
}) {
  const { data } = await http.post<
    ApiResponse<{ conversationId: number }>
  >('/conversations', payload);
  return data;
}

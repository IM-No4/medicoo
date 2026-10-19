import { apiClient } from './client';

export interface LiveChatMessage {
  _id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
}

export interface LiveChat {
  _id: string;
  status: 'bot' | 'waiting' | 'open' | 'closed';
  subject: string;
  category: string;
  messages: LiveChatMessage[];
  createdOn: string;
  lastActivityAt: string;
}

/** The welcome and topics for the general support chat: decided by the server, so they can change without an app update. */
export interface LiveChatIntro {
  greeting: string;
  prompt: string;
  categories: { value: string; label: string }[];
}

export const getLiveChatIntro = async (): Promise<LiveChatIntro> => {
  const res = await apiClient.get('/api/live-chat/customer/intro');
  return res.data.data as LiveChatIntro;
};

export const getActiveLiveChat = async (): Promise<LiveChat | null> => {
  const res = await apiClient.get('/api/live-chat/customer/active');
  return res.data?.data ?? null;
};

/**
 * Opening the chat screen creates nothing: a session exists only once the customer sends a message. That first message goes
 * with the start, so the server creates the session and delivers the message (and the assistant's reply) in one go.
 */
export const startLiveChat = async (subject: string, category?: string, message?: string): Promise<LiveChat> => {
  const res = await apiClient.post('/api/live-chat/customer/start', { subject, category, message });
  return res.data.data as LiveChat;
};

export const sendLiveChatMessage = async (chatId: string, text: string): Promise<LiveChatMessage> => {
  const res = await apiClient.post(`/api/live-chat/customer/${chatId}/messages`, { text });
  return res.data.data as LiveChatMessage;
};

export const closeLiveChat = async (chatId: string): Promise<LiveChat> => {
  const res = await apiClient.post(`/api/live-chat/customer/${chatId}/close`);
  return res.data.data as LiveChat;
};

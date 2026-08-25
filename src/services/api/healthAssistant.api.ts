import { apiClient } from "./client";

export interface HealthAssistantQueryResponse {
  query: string;
  response: string;
  timestamp: string;
  type: string;
  confidence: string;
  disclaimer: string | null;
  quickReplies: string[];
  suggestedActions: string[];
  followUpQuestions: string[];
  interactionId: string;
  sessionId: string;
  responseTime: number;
  userProfile: {
    name?: string;
    age?: number | null;
    gender?: string | null;
    hasMedicalConditions?: boolean;
  } | null;
}

// POST /api/v1/health-assistant/query - the backend auto-creates or resumes
// a conversation session server-side when sessionId is omitted, so callers
// only need to remember and pass back the sessionId this returns for
// subsequent messages in the same conversation.
export const sendHealthAssistantQuery = async (
  query: string,
  sessionId?: string,
): Promise<HealthAssistantQueryResponse> => {
  const response = await apiClient.post("/api/v1/health-assistant/query", {
    query,
    sessionId,
  });
  return response.data.data as HealthAssistantQueryResponse;
};

export interface HealthAssistantSession {
  sessionId: string;
  date: string;
  firstMessage: string;
  lastMessage: string;
  messageCount: number;
  lastActivity: string;
  isActive: boolean;
}

// GET /api/v1/health-assistant/sessions - past conversations, most recently
// active first, grouped server-side by sessionId.
export const getHealthAssistantSessions = async (
  limit = 20,
): Promise<HealthAssistantSession[]> => {
  const response = await apiClient.get("/api/v1/health-assistant/sessions", {
    params: { limit },
  });
  return (response.data.data ?? []) as HealthAssistantSession[];
};

export interface HealthAssistantInteractionRecord {
  id: string;
  query: string;
  response: string;
  timestamp: string;
}

// GET /api/v1/health-assistant/session-history/:sessionId - the full
// query/response pairs for one past conversation, oldest first.
export const getHealthAssistantSessionHistory = async (
  sessionId: string,
): Promise<HealthAssistantInteractionRecord[]> => {
  const response = await apiClient.get(
    `/api/v1/health-assistant/session-history/${sessionId}`,
  );
  return (response.data.data ?? []) as HealthAssistantInteractionRecord[];
};

import { apiClient } from "./client";

export interface AssessmentCategoryResult {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  bucket: "Needs attention" | "Fair" | "Good";
  tip: string;
}

export interface HealthRiskAssessmentResult {
  id: string;
  categories: AssessmentCategoryResult[];
  overallScore: number;
  overallMaxScore: number;
  overallBucket: "Needs attention" | "Fair" | "Good";
  createdAt: string;
}

// POST /api/v1/health-risk-assessment/submit - answers is
// { [questionKey]: selectedOptionIndex }. Scoring is fully deterministic on
// the backend (no AI) - see healthRiskAssessmentScoring.js there.
export const submitHealthRiskAssessment = async (
  answers: Record<string, number>,
): Promise<HealthRiskAssessmentResult> => {
  const response = await apiClient.post("/api/v1/health-risk-assessment/submit", {
    answers,
  });
  return response.data.data as HealthRiskAssessmentResult;
};

// GET /api/v1/health-risk-assessment/latest - null if the user has never
// completed one.
export const getLatestHealthRiskAssessment = async (): Promise<HealthRiskAssessmentResult | null> => {
  const response = await apiClient.get("/api/v1/health-risk-assessment/latest");
  return (response.data.data ?? null) as HealthRiskAssessmentResult | null;
};

// GET /api/v1/health-risk-assessment/history - past assessments, most
// recent first.
export const getHealthRiskAssessmentHistory = async (
  limit = 20,
): Promise<HealthRiskAssessmentResult[]> => {
  const response = await apiClient.get("/api/v1/health-risk-assessment/history", {
    params: { limit },
  });
  return (response.data.data ?? []) as HealthRiskAssessmentResult[];
};

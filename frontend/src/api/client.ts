import type {
  CrackResponse,
  DailyRequest,
  DailyResponse,
  Discipline,
  FeatureInfo,
  Health,
  KnowledgeResponse,
  PlanningRequest,
  PlanningResponse,
  SafetyResponse,
  ValuationRequest,
  ValuationResponse,
  WeatherRequest,
  WeatherResponse,
} from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (Array.isArray(record.detail)) {
    const parts = record.detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return null;
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join("; ");
  }
  if (typeof record.message === "string") return record.message;
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(
      "Cannot reach the API. Start the FastAPI server on port 8000 and try again.",
      0,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}.`;
    const message = messageFromBody(body, fallback);
    const code =
      body && typeof body === "object" && "code" in body
        ? String((body as { code: unknown }).code)
        : undefined;
    throw new ApiError(message, response.status, code);
  }

  return body as T;
}

function buildForm(
  fields: Record<string, string | number | null | undefined>,
  image?: File | null,
): FormData {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      form.append(key, String(value));
    }
  });
  if (image) form.append("image", image);
  return form;
}

export const api = {
  health: () => request<Health>("/api/health"),
  features: () => request<{ count: number; features: FeatureInfo[] }>("/api/features"),

  safety: (image: File, notes?: string) =>
    request<SafetyResponse>("/api/safety/analyze", {
      method: "POST",
      body: buildForm({ notes }, image),
    }),

  cracks: (image: File, notes?: string) =>
    request<CrackResponse>("/api/cracks/analyze", {
      method: "POST",
      body: buildForm({ notes }, image),
    }),

  valuation: (payload: ValuationRequest) =>
    request<ValuationResponse>("/api/valuation/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  planning: (payload: PlanningRequest) =>
    request<PlanningResponse>("/api/planning/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  daily: (payload: DailyRequest) =>
    request<DailyResponse>("/api/daily/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  weather: (payload: WeatherRequest) =>
    request<WeatherResponse>("/api/weather/advisory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  knowledge: (question: string, discipline: Discipline, image?: File | null) =>
    request<KnowledgeResponse>("/api/knowledge/ask", {
      method: "POST",
      body: buildForm({ question, discipline }, image),
    }),
};

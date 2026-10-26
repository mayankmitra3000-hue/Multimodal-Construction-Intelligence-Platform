export type Source = "gemini" | "mock";
export type Severity = "low" | "medium" | "high" | "critical";
export type Priority = "low" | "medium" | "high";
export type Impact = "positive" | "neutral" | "negative";
export type Urgency = "monitor" | "schedule" | "urgent" | "immediate";
export type Suitability = "good" | "caution" | "avoid";
export type PropertyType =
  | "apartment"
  | "house"
  | "villa"
  | "commercial"
  | "industrial"
  | "land";
export type Condition = "excellent" | "good" | "fair" | "poor";
export type Discipline =
  | "general"
  | "structural"
  | "safety"
  | "mep"
  | "architecture"
  | "estimating"
  | "scheduling";

export interface ResponseMeta {
  source: Source;
  model: string | null;
  generated_at: string;
  latency_ms: number;
  warnings: string[];
}

export interface MoneyRange {
  min: number;
  max: number;
  currency: string;
}

export interface Confidence {
  score: number;
  rationale: string;
}

export interface Hazard {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  description: string;
  location: string;
  evidence: string;
  recommendation: string;
}

export interface PPEItem {
  name: string;
  status: "detected" | "not_detected" | "unclear";
  confidence: number;
}

export interface SafetyResponse {
  overall_risk: Severity;
  summary: string;
  workers_detected: number;
  hazards: Hazard[];
  ppe_items: PPEItem[];
  compliance_score: number;
  immediate_actions: string[];
  recommendations: string[];
  confidence: Confidence;
  meta: ResponseMeta;
}

export interface CrackDimensions {
  length_cm: number | null;
  width_mm: number | null;
  estimated_depth_mm: number | null;
}

export interface RepairOption {
  method: string;
  description: string;
  estimated_cost: MoneyRange;
  lifespan_years: number | null;
}

export interface CrackResponse {
  crack_detected: boolean;
  crack_type:
    | "hairline"
    | "flexural"
    | "shear"
    | "settlement"
    | "thermal"
    | "corrosion"
    | "shrinkage"
    | "unknown"
    | null;
  severity: Severity;
  severity_score: number;
  dimensions: CrackDimensions;
  location: string;
  probable_cause: string;
  structural_assessment: string;
  urgency: Urgency;
  repair_options: RepairOption[];
  estimated_repair_cost: MoneyRange;
  monitoring_plan: string[];
  recommendations: string[];
  confidence: Confidence;
  meta: ResponseMeta;
}

export interface ValuationRequest {
  location: string;
  property_type: PropertyType;
  area_sqm: number;
  age_years: number;
  condition: Condition;
  bedrooms?: number | null;
  bathrooms?: number | null;
  amenities: string[];
  currency: string;
  notes?: string | null;
}

export interface ValuationFactor {
  name: string;
  impact: Impact;
  weight: number;
  explanation: string;
}

export interface ValuationResponse {
  estimated_value: MoneyRange;
  price_per_sqm: MoneyRange;
  confidence: Confidence;
  market_outlook: "declining" | "stable" | "appreciating";
  valuation_factors: ValuationFactor[];
  comparable_note: string;
  assumptions: string[];
  recommendations: string[];
  meta: ResponseMeta;
}

export interface PlanningRequest {
  project_name: string;
  description: string;
  location?: string | null;
  budget?: number | null;
  currency: string;
  start_date?: string | null;
  duration_weeks_target?: number | null;
  team_size?: number | null;
  constraints: string[];
}

export interface PlanTask {
  id: string;
  name: string;
  duration_days: number;
  depends_on: string[];
  trade: string;
  crew_size: number;
}

export interface Phase {
  name: string;
  start_day: number;
  end_day: number;
  summary: string;
  tasks: PlanTask[];
}

export interface Milestone {
  name: string;
  day: number;
  deliverable: string;
}

export interface ResourcePlan {
  role: string;
  headcount: number;
  allocation_weeks: number;
}

export interface BudgetLine {
  category: string;
  percent: number;
  amount: number | null;
}

export interface ProjectRisk {
  title: string;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string;
}

export interface PlanningResponse {
  summary: string;
  total_duration_days: number;
  phases: Phase[];
  milestones: Milestone[];
  critical_path: string[];
  resource_plan: ResourcePlan[];
  budget_breakdown: BudgetLine[];
  risks: ProjectRisk[];
  assumptions: string[];
  meta: ResponseMeta;
}

export interface DailyRequest {
  notes: string;
  weather?: string | null;
  report_date?: string | null;
  priorities: string[];
}

export interface Issue {
  title: string;
  severity: Severity;
  description: string;
  suggested_action: string;
}

export interface ActionItem {
  task: string;
  owner: string | null;
  due: string | null;
  priority: Priority;
}

export interface DailyResponse {
  executive_summary: string;
  key_updates: string[];
  issues: Issue[];
  action_items: ActionItem[];
  workforce_summary: string;
  materials_and_equipment: string[];
  safety_observations: string[];
  tomorrow_focus: string[];
  meta: ResponseMeta;
}

export interface WeatherRequest {
  location: string;
  start_date?: string | null;
  days: number;
  trade?: string | null;
  activities: string[];
}

export interface DayForecast {
  date: string;
  condition: string;
  temp_min_c: number;
  temp_max_c: number;
  precipitation_chance: number;
  wind_kph: number;
}

export interface ActivitySuitability {
  activity: string;
  suitability: Suitability;
  reason: string;
  best_window: string;
}

export interface WeatherResponse {
  location: string;
  outlook: DayForecast[];
  suitability: ActivitySuitability[];
  advisories: string[];
  safety_notes: string[];
  schedule_impact: string;
  data_note: string;
  meta: ResponseMeta;
}

export interface KnowledgeResponse {
  answer: string;
  key_points: string[];
  applicable_codes: string[];
  safety_notes: string[];
  related_topics: string[];
  image_analyzed: boolean;
  confidence: Confidence;
  disclaimer: string;
  meta: ResponseMeta;
}

export interface Health {
  status: string;
  version: string;
  ai: {
    mode: "auto" | "gemini" | "mock";
    effective_mode: "gemini" | "mock";
    provider_configured: boolean;
    model: string;
  };
  feature_count: number;
}

export interface FeatureInfo {
  id: string;
  title: string;
  description: string;
  method: string;
  endpoint: string;
  input: "json" | "multipart";
  requires_image: boolean;
}

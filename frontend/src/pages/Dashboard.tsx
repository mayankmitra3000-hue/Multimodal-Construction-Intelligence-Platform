import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpenCheck,
  Building2,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  CloudSun,
  Cpu,
  FileJson,
  Gauge,
  Layers,
  ScanLine,
  ShieldAlert,
  Sparkles,
  WifiOff,
} from "lucide-react";

import type { Health } from "../types";
import { Alert, Badge, Button, Card } from "../components/ui";

const features = [
  {
    to: "/safety",
    icon: ShieldAlert,
    title: "Site Safety Monitor",
    description:
      "Audit site photos for hazards, PPE compliance, and risk severity with prioritized corrective actions.",
    tag: "Vision + context",
    className: "feature-safety",
  },
  {
    to: "/cracks",
    icon: ScanLine,
    title: "Crack Detection",
    description:
      "Classify cracks, estimate dimensions and severity, then compare repair methods and cost ranges.",
    tag: "Vision forensics",
    className: "feature-cracks",
  },
  {
    to: "/valuation",
    icon: Building2,
    title: "Real Estate Valuation",
    description:
      "Turn property attributes into a defensible value range, price per m², and factor-weighted rationale.",
    tag: "Market reasoning",
    className: "feature-valuation",
  },
  {
    to: "/planning",
    icon: CalendarRange,
    title: "Project Planning",
    description:
      "Generate a phased programme with dependencies, milestones, critical path, resources, and budget.",
    tag: "Schedule synthesis",
    className: "feature-planning",
  },
  {
    to: "/daily",
    icon: ClipboardList,
    title: "Daily Site Assistant",
    description:
      "Convert raw daily logs into an executive summary, issue register, owned actions, and next-day focus.",
    tag: "Text intelligence",
    className: "feature-daily",
  },
  {
    to: "/weather",
    icon: CloudSun,
    title: "Weather Advisory",
    description:
      "Assess work-window suitability for each activity with weather-driven safety and schedule advisories.",
    tag: "Risk windows",
    className: "feature-weather",
  },
  {
    to: "/knowledge",
    icon: BookOpenCheck,
    title: "Construction Knowledge",
    description:
      "Ask practical construction questions, optionally attach a reference image, and get structured guidance.",
    tag: "Q&A + image",
    className: "feature-knowledge",
  },
];

const stats = [
  { icon: Sparkles, value: "7", label: "AI workspaces" },
  { icon: Layers, value: "3", label: "Input modalities" },
  { icon: Gauge, value: "100%", label: "Schema validated" },
  { icon: FileJson, value: "7", label: "Typed endpoints" },
];

export default function Dashboard({
  health,
  onRetry,
}: {
  health: Health | null;
  onRetry: () => void;
}) {
  const online = Boolean(health);
  const live = health?.ai.effective_mode === "gemini";

  return (
    <div className="dashboard">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="pulse" />
            AI-powered multimodal construction intelligence
          </div>
          <h1>
            See the site.
            <br />
            Understand the risk.
            <br />
            <span>Plan the next move.</span>
          </h1>
          <p>
            A full-stack decision-support workspace that reads site photos, daily logs,
            property data, and project briefs to produce safety, cost, schedule, and
            knowledge outputs your team can act on.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/safety">
              <ShieldAlert size={16} />
              Run a safety audit
            </Link>
            <Link className="btn btn-secondary" to="/planning">
              <CalendarRange size={16} />
              Generate a programme
            </Link>
          </div>
          <div className="hero-trust">
            <span>
              <CheckCircle2 size={14} /> Strict JSON contracts
            </span>
            <span>
              <CheckCircle2 size={14} /> Deterministic demo fallback
            </span>
            <span>
              <CheckCircle2 size={14} /> Gemini multimodal
            </span>
          </div>
        </div>

        <Card className="status-card" accent>
          <div className="status-card-head">
            <div>
              <span className="eyebrow">Platform status</span>
              <h2>{online ? "Systems nominal" : "Backend offline"}</h2>
            </div>
            <Badge tone={online ? (live ? "green" : "amber") : "red"} dot>
              {online ? (live ? "Live AI" : "Demo mode") : "Offline"}
            </Badge>
          </div>

          {online && health ? (
            <div className="status-rows">
              <div>
                <span>
                  <Cpu size={14} /> AI engine
                </span>
                <strong>{health.ai.model}</strong>
              </div>
              <div>
                <span>Provider key</span>
                <strong>{health.ai.provider_configured ? "Configured" : "Not configured"}</strong>
              </div>
              <div>
                <span>Requested mode</span>
                <strong>{health.ai.mode}</strong>
              </div>
              <div>
                <span>Feature endpoints</span>
                <strong>{health.feature_count} online</strong>
              </div>
              <div>
                <span>API version</span>
                <strong>v{health.version}</strong>
              </div>
            </div>
          ) : (
            <div className="status-offline-panel">
              <WifiOff size={26} />
              <p>
                Start the FastAPI service to unlock the workspaces. The UI is ready, but
                inference requests will fail until the backend is running.
              </p>
              <code>cd backend && .venv\Scripts\python -m uvicorn app.main:app --reload</code>
              <Button variant="secondary" onClick={onRetry}>
                Retry connection
              </Button>
            </div>
          )}

          {online && health && !live ? (
            <Alert tone="warning" title="Running on the demo engine">
              Add <code>GEMINI_API_KEY</code> to <code>backend/.env</code> and restart the API
              for live multimodal analysis. All seven workflows stay fully usable now.
            </Alert>
          ) : null}
        </Card>
      </section>

      <section className="stats-row">
        {stats.map(({ icon: Icon, value, label }) => (
          <div className="mini-stat" key={label}>
            <Icon size={18} />
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="section-head">
        <div>
          <span className="eyebrow">Workspaces</span>
          <h2>Pick the intelligence you need</h2>
        </div>
        <p>Each module returns a validated contract, ready for dashboards and downstream automation.</p>
      </section>

      <section className="feature-grid">
        {features.map(({ to, icon: Icon, title, description, tag, className }) => (
          <Link to={to} key={to} className={`feature-card ${className}`}>
            <div className="feature-top">
              <div className="feature-icon">
                <Icon size={21} />
              </div>
              <ArrowUpRight size={18} className="feature-arrow" />
            </div>
            <span className="feature-tag">{tag}</span>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className="feature-link">Open workspace</span>
          </Link>
        ))}
      </section>

      <section className="workflow">
        <div className="workflow-copy">
          <span className="eyebrow">How it works</span>
          <h2>From field signal to structured decision</h2>
          <p>
            Upload or describe the situation. Gemini reasons across text and images. The
            backend validates the response against a strict Pydantic contract before it
            ever reaches your screen.
          </p>
        </div>
        <div className="workflow-steps">
          <div className="workflow-step">
            <span>01</span>
            <div>
              <strong>Capture</strong>
              <p>Photos, site notes, property attributes, or a project brief.</p>
            </div>
          </div>
          <div className="workflow-step">
            <span>02</span>
            <div>
              <strong>Reason</strong>
              <p>Multimodal model applies construction domain judgment.</p>
            </div>
          </div>
          <div className="workflow-step">
            <span>03</span>
            <div>
              <strong>Act</strong>
              <p>Typed findings, costs, actions, and schedule guidance.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contract-note">
        <FileJson size={20} />
        <div>
          <strong>Contract-first AI integration</strong>
          <p>
            Every response carries source, model, latency, and warnings in a{" "}
            <code>meta</code> block. Providers are retried, validated, and can fall back to
            deterministic demo data without breaking the frontend.
          </p>
        </div>
      </section>
    </div>
  );
}

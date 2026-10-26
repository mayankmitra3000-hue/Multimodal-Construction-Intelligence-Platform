import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BookOpenCheck,
  Building2,
  CalendarRange,
  ClipboardList,
  CloudSun,
  HardHat,
  LayoutDashboard,
  Menu,
  ScanLine,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import type { Health } from "../types";
import { Badge } from "./ui";

const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/safety", label: "Safety Monitor", icon: ShieldAlert },
  { to: "/cracks", label: "Crack Analysis", icon: ScanLine },
  { to: "/valuation", label: "Valuation", icon: Building2 },
  { to: "/planning", label: "Project Planning", icon: CalendarRange },
  { to: "/daily", label: "Daily Assistant", icon: ClipboardList },
  { to: "/weather", label: "Weather Advisory", icon: CloudSun },
  { to: "/knowledge", label: "Knowledge Base", icon: BookOpenCheck },
];

function ProviderStatus({ health }: { health: Health | null }) {
  if (!health) {
    return (
      <div className="provider-status">
        <span className="status-dot status-offline" />
        <div>
          <strong>API offline</strong>
          <span>Start the FastAPI server on :8000</span>
        </div>
      </div>
    );
  }
  const live = health.ai.effective_mode === "gemini";
  return (
    <div className="provider-status">
      <span className={live ? "status-dot status-live" : "status-dot status-demo"} />
      <div>
        <strong>{live ? "Gemini connected" : "Demo engine"}</strong>
        <span>{health.ai.model}</span>
      </div>
    </div>
  );
}

export default function Layout({ health }: { health: Health | null }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <div
        className={`mobile-overlay ${open ? "mobile-overlay-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <HardHat size={22} />
          </div>
          <div>
            <strong>BuildSense</strong>
            <span>Construction Intelligence</span>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-chip">
          <Sparkles size={14} />
          <span>Multimodal workspace</span>
          <Badge tone="amber">AI</Badge>
        </div>

        <nav className="nav">
          <span className="nav-label">Workspace</span>
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <ProviderStatus health={health} />
          <p className="sidebar-note">
            Decision support only. Verify structural, safety, and valuation outputs with a
            licensed professional.
          </p>
          <span className="version">v{health?.version ?? "0.1.0"} · strict JSON contracts</span>
        </div>
      </aside>

      <div className="main-wrap">
        <div className="mobile-bar">
          <button
            type="button"
            className="icon-button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="mobile-brand">
            <HardHat size={18} />
            <span>BuildSense AI</span>
          </div>
          <Badge tone={health?.ai.effective_mode === "gemini" ? "green" : "amber"} dot>
            {health?.ai.effective_mode === "gemini" ? "Live" : "Demo"}
          </Badge>
        </div>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

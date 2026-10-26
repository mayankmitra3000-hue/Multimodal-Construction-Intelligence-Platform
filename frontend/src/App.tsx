import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

import { api } from "./api/client";
import Layout from "./components/Layout";
import { EmptyState } from "./components/ui";
import type { Health } from "./types";
import CrackAnalysis from "./pages/CrackAnalysis";
import DailyAssistant from "./pages/DailyAssistant";
import Dashboard from "./pages/Dashboard";
import KnowledgeAssistant from "./pages/KnowledgeAssistant";
import Planning from "./pages/Planning";
import SafetyMonitor from "./pages/SafetyMonitor";
import Valuation from "./pages/Valuation";
import WeatherAdvisory from "./pages/WeatherAdvisory";

function NotFound() {
  return (
    <div className="not-found">
      <EmptyState
        title="Workspace not found"
        description="That route does not exist. Head back to the command center."
        action={
          <Link className="btn btn-primary" to="/">
            Back to overview
          </Link>
        }
      />
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const next = await api.health();
        if (active) setHealth(next);
      } catch {
        if (active) setHealth(null);
      }
    }
    load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Routes>
      <Route element={<Layout health={health} />}>
        <Route index element={<Dashboard health={health} onRetry={() => window.location.reload()} />} />
        <Route path="/safety" element={<SafetyMonitor />} />
        <Route path="/cracks" element={<CrackAnalysis />} />
        <Route path="/valuation" element={<Valuation />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/daily" element={<DailyAssistant />} />
        <Route path="/weather" element={<WeatherAdvisory />} />
        <Route path="/knowledge" element={<KnowledgeAssistant />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

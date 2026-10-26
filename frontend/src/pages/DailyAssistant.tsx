import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  CloudSun,
  Package,
  ShieldCheck,
  Users,
} from "lucide-react";

import { api } from "../api/client";
import {
  Alert,
  Badge,
  BulletList,
  Button,
  Card,
  EmptyState,
  Field,
  JsonViewer,
  LoadingResult,
  MetaBar,
  PageHeader,
  SeverityBadge,
  Stat,
  TextArea,
  TextInput,
} from "../components/ui";
import { useAsyncAction } from "../lib/useAsyncAction";
import { formatDate, splitList, titleCase, toDateInput } from "../lib/format";
import type { DailyResponse } from "../types";

const sampleNotes = `28 workers on site across formwork, rebar, and MEP crews.
Level 3 slab pour completed at 11:30 with 96 m³ placed; curing compound applied.
Rebar shortage delayed the east core; supplier confirmed 2 tonnes for tomorrow 07:00.
Unsafe storage of plywood near the walkway on level 1; housekeeping crew notified.
Concrete pump required maintenance at 14:00, standby pump mobilized by 15:15.
Need to inspect the north formwork before tomorrow's pour and confirm the surveyor's setting-out.

Weather: light rain after 15:00, site roads slippery.`;

export default function DailyAssistant() {
  const [notes, setNotes] = useState(sampleNotes);
  const [weather, setWeather] = useState("Light rain after 15:00");
  const [reportDate, setReportDate] = useState(toDateInput());
  const [priorities, setPriorities] = useState("Close out rebar delivery, inspect north formwork");
  const [formError, setFormError] = useState<string | null>(null);
  const { data, loading, error, run } = useAsyncAction<DailyResponse>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (notes.trim().length < 10) {
      setFormError("Paste at least a short site log before summarizing.");
      return;
    }
    setFormError(null);
    await run(() =>
      api.daily({
        notes: notes.trim(),
        weather: weather || null,
        report_date: reportDate || null,
        priorities: splitList(priorities),
      }),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Text · Site reporting"
        title="Daily Site Assistant"
        description="Turn raw site notes into a crisp daily report with issues, owned actions, safety observations, and tomorrow's focus."
        actions={<Badge tone="green">Daily workflow</Badge>}
      />

      <div className="workspace">
        <Card title="Site log" subtitle="Paste the day's notes exactly as they come in.">
          <form onSubmit={submit} className="form-stack">
            <Field
              label="Raw site notes"
              htmlFor="daily-notes"
              hint="Crew, progress, delays, deliveries, safety, quality."
            >
              <TextArea
                id="daily-notes"
                rows={12}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>
            <div className="form-grid">
              <Field label="Report date" htmlFor="daily-date">
                <TextInput
                  id="daily-date"
                  type="date"
                  value={reportDate}
                  onChange={(event) => setReportDate(event.target.value)}
                />
              </Field>
              <Field label="Weather" htmlFor="daily-weather">
                <TextInput
                  id="daily-weather"
                  value={weather}
                  onChange={(event) => setWeather(event.target.value)}
                  placeholder="Rain after 15:00, 24 °C"
                />
              </Field>
              <Field
                label="Tomorrow's priorities"
                htmlFor="daily-priorities"
                hint="Comma-separated."
                className="span-2"
              >
                <TextInput
                  id="daily-priorities"
                  value={priorities}
                  onChange={(event) => setPriorities(event.target.value)}
                />
              </Field>
            </div>
            {formError ? <Alert tone="danger">{formError}</Alert> : null}
            <Button type="submit" loading={loading} icon={<ClipboardList size={16} />} full>
              Summarize the day
            </Button>
          </form>
        </Card>

        <div className="result-column">
          {error ? (
            <Alert tone="danger" title="Summary failed">
              {error}
            </Alert>
          ) : null}
          {loading ? (
            <Card>
              <LoadingResult label="Writing the daily report" />
            </Card>
          ) : data ? (
            <DailyResult data={data} reportDate={reportDate} />
          ) : (
            <Card>
              <EmptyState
                icon={<ClipboardList size={26} />}
                title="No daily report yet"
                description="Paste the site log to generate an executive summary, issues, and action items."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DailyResult({ data, reportDate }: { data: DailyResponse; reportDate: string }) {
  return (
    <div className="result-stack">
      <Card
        title="Daily report"
        subtitle={data.executive_summary}
        actions={
          <Badge tone="slate">
            <CalendarDays size={12} /> {reportDate ? formatDate(reportDate) : "Today"}
          </Badge>
        }
      >
        <div className="result-stats">
          <Stat label="Key updates" value={data.key_updates.length} tone="blue" />
          <Stat
            label="Open issues"
            value={data.issues.length}
            tone={data.issues.length > 0 ? "amber" : "green"}
            hint={`${data.issues.filter((issue) => issue.severity === "critical" || issue.severity === "high").length} high severity`}
          />
          <Stat
            label="Action items"
            value={data.action_items.length}
            tone="default"
            hint={`${data.action_items.filter((item) => item.priority === "high").length} high priority`}
          />
        </div>
      </Card>

      <div className="split-results">
        <Card title="Key updates" subtitle="Factual progress pulled from the log.">
          <BulletList items={data.key_updates} />
        </Card>
        <Card title="Workforce" subtitle="Headcount and resourcing signal.">
          <div className="workforce">
            <Users size={22} />
            <p>{data.workforce_summary}</p>
          </div>
        </Card>
      </div>

      {data.issues.length > 0 ? (
        <Card title="Issues" subtitle="Ranked by severity with a suggested response.">
          <div className="issue-list">
            {data.issues.map((issue) => (
              <article className="issue" key={issue.title}>
                <div className="issue-head">
                  <h3>{issue.title}</h3>
                  <SeverityBadge value={issue.severity} />
                </div>
                <p>{issue.description}</p>
                <div className="issue-action">
                  <ArrowRight size={14} />
                  <span>{issue.suggested_action}</span>
                </div>
              </article>
            ))}
          </div>
        </Card>
      ) : (
        <Alert tone="success" title="No open issues detected">
          The log did not contain a clear delay, defect, safety, or resource issue.
        </Alert>
      )}

      <Card title="Action items" subtitle="Owned next steps for the team.">
        <div className="action-list">
          {data.action_items.map((item, index) => (
            <article className="action-item" key={`${item.task}-${index}`}>
              <span className={`priority-dot priority-${item.priority}`} />
              <div className="action-main">
                <strong>{item.task}</strong>
                <div className="action-meta">
                  <span>{item.owner ?? "Unassigned"}</span>
                  <span>{item.due ?? "No due date"}</span>
                </div>
              </div>
              <Badge
                tone={
                  item.priority === "high"
                    ? "red"
                    : item.priority === "medium"
                      ? "amber"
                      : "slate"
                }
              >
                {titleCase(item.priority)}
              </Badge>
            </article>
          ))}
        </div>
      </Card>

      <div className="split-results">
        <Card title="Materials & equipment" subtitle="Deliveries, shortfalls, and plant.">
          <div className="icon-list">
            {data.materials_and_equipment.map((item) => (
              <div key={item}>
                <Package size={14} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Safety observations">
          <div className="icon-list">
            {data.safety_observations.map((item) => (
              <div key={item}>
                <ShieldCheck size={14} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Tomorrow's focus" subtitle="Carry these into the morning briefing.">
        <div className="focus-list">
          {data.tomorrow_focus.map((item, index) => (
            <div key={item} className="focus-item">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
              <CloudSun size={15} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Response metadata" subtitle="Contract provenance and quality signals.">
        <MetaBar meta={data.meta} />
        <JsonViewer data={data} />
      </Card>
    </div>
  );
}

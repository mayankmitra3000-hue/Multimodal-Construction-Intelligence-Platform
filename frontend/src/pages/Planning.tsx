import { useState, type FormEvent } from "react";
import {
  CalendarRange,
  CircleDollarSign,
  Flag,
  GitBranch,
  Layers,
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
  Select,
  Stat,
  TextArea,
  TextInput,
} from "../components/ui";
import { useAsyncAction } from "../lib/useAsyncAction";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
  splitList,
  titleCase,
  toDateInput,
} from "../lib/format";
import type { PlanningResponse } from "../types";

const currencies = ["USD", "EUR", "GBP", "AED", "SAR", "INR", "ZAR", "CAD", "AUD"];

export default function Planning() {
  const [projectName, setProjectName] = useState("Riverside Community Clinic");
  const [description, setDescription] = useState(
    "Three-storey reinforced concrete community clinic with 40 parking bays, an emergency entrance, and rooftop plant. Target high-performance envelope and efficient MEP.",
  );
  const [location, setLocation] = useState("Lagos, Nigeria");
  const [budget, setBudget] = useState("2500000");
  const [currency, setCurrency] = useState("USD");
  const [startDate, setStartDate] = useState(toDateInput(7));
  const [weeks, setWeeks] = useState("40");
  const [teamSize, setTeamSize] = useState("30");
  const [constraints, setConstraints] = useState(
    "Occupied neighbouring site\nRainy season from June to September\nSingle access road",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const { data, loading, error, run } = useAsyncAction<PlanningResponse>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (projectName.trim().length < 2 || description.trim().length < 10) {
      setFormError("Add a project name and a description of at least 10 characters.");
      return;
    }
    setFormError(null);
    await run(() =>
      api.planning({
        project_name: projectName.trim(),
        description: description.trim(),
        location: location || null,
        budget: budget ? Number(budget) : null,
        currency,
        start_date: startDate || null,
        duration_weeks_target: weeks ? Number(weeks) : null,
        team_size: teamSize ? Number(teamSize) : null,
        constraints: splitList(constraints),
      }),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Text · Programme synthesis"
        title="Construction Project Planning"
        description="Turn a project brief into a phased programme with dependencies, milestones, critical path, resource loading, and budget allocation."
        actions={<Badge tone="purple">Schedule intelligence</Badge>}
      />

      <div className="workspace">
        <Card title="Project brief" subtitle="Describe scope, constraints, and targets.">
          <form onSubmit={submit} className="form-stack">
            <Field label="Project name" htmlFor="plan-name">
              <TextInput
                id="plan-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </Field>
            <Field label="Scope description" htmlFor="plan-description">
              <TextArea
                id="plan-description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            <div className="form-grid">
              <Field label="Location" htmlFor="plan-location" className="span-2">
                <TextInput
                  id="plan-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </Field>
              <Field label={`Budget (${currency})`} htmlFor="plan-budget">
                <TextInput
                  id="plan-budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </Field>
              <Field label="Currency" htmlFor="plan-currency">
                <Select
                  id="plan-currency"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                >
                  {currencies.map((code) => (
                    <option value={code} key={code}>
                      {code}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Start date" htmlFor="plan-start">
                <TextInput
                  id="plan-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </Field>
              <Field label="Target duration (weeks)" htmlFor="plan-weeks">
                <TextInput
                  id="plan-weeks"
                  type="number"
                  min="1"
                  max="520"
                  value={weeks}
                  onChange={(event) => setWeeks(event.target.value)}
                />
              </Field>
              <Field label="Peak team size" htmlFor="plan-team">
                <TextInput
                  id="plan-team"
                  type="number"
                  min="1"
                  value={teamSize}
                  onChange={(event) => setTeamSize(event.target.value)}
                />
              </Field>
              <Field label="Constraints" htmlFor="plan-constraints" className="span-2" hint="One per line or comma-separated.">
                <TextArea
                  id="plan-constraints"
                  rows={3}
                  value={constraints}
                  onChange={(event) => setConstraints(event.target.value)}
                />
              </Field>
            </div>
            {formError ? <Alert tone="danger">{formError}</Alert> : null}
            <Button type="submit" loading={loading} icon={<CalendarRange size={16} />} full>
              Generate programme
            </Button>
          </form>
        </Card>

        <div className="result-column">
          {error ? (
            <Alert tone="danger" title="Planning failed">
              {error}
            </Alert>
          ) : null}
          {loading ? (
            <Card>
              <LoadingResult label="Sequencing the programme" />
            </Card>
          ) : data ? (
            <PlanningResult data={data} startDate={startDate} currency={currency} />
          ) : (
            <Card>
              <EmptyState
                icon={<CalendarRange size={26} />}
                title="No programme yet"
                description="Describe the project to generate a phased schedule, milestones, and resource plan."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function dayLabel(startDate: string, day: number): string | null {
  if (!startDate) return null;
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + day - 1);
  return formatDate(date.toISOString().slice(0, 10));
}

function PlanningResult({
  data,
  startDate,
  currency,
}: {
  data: PlanningResponse;
  startDate: string;
  currency: string;
}) {
  const total = data.total_duration_days;
  const allTasks = data.phases.flatMap((phase) => phase.tasks);
  const taskNames = new Map(allTasks.map((task) => [task.id, task.name]));
  const budgetTotal = data.budget_breakdown.reduce(
    (sum, line) => sum + (line.amount ?? 0),
    0,
  );
  const start = dayLabel(startDate, 1);

  return (
    <div className="result-stack">
      <Card
        title="Programme overview"
        subtitle={data.summary}
        actions={<Badge tone="purple">{formatDuration(total)}</Badge>}
      >
        <div className="result-stats four">
          <Stat label="Total duration" value={formatDuration(total)} tone="blue" />
          <Stat label="Phases" value={data.phases.length} hint={`${allTasks.length} tasks`} />
          <Stat label="Milestones" value={data.milestones.length} tone="green" />
          <Stat
            label="Budget"
            value={
              budgetTotal > 0 ? formatCurrency(budgetTotal, currency) : "Not supplied"
            }
            hint={start ? `Starts ${start}` : "Day offsets from start"}
          />
        </div>
      </Card>

      <Card title="Phased programme" subtitle="Durations are shown as day offsets from project start.">
        <div className="phase-list">
          {data.phases.map((phase, index) => {
            const offset = ((phase.start_day - 1) / total) * 100;
            const width = ((phase.end_day - phase.start_day + 1) / total) * 100;
            const from = dayLabel(startDate, phase.start_day);
            const to = dayLabel(startDate, phase.end_day);
            return (
              <details className="phase" key={phase.name} open={index === 0}>
                <summary>
                  <div className="phase-summary">
                    <span className="phase-index">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{phase.name}</strong>
                      <span>
                        Day {phase.start_day}–{phase.end_day}
                        {from && to ? ` · ${from} → ${to}` : ""} · {phase.tasks.length} tasks
                      </span>
                    </div>
                    <Badge tone="slate">{phase.end_day - phase.start_day + 1} days</Badge>
                  </div>
                  <div className="phase-track">
                    <span style={{ marginLeft: `${offset}%`, width: `${width}%` }} />
                  </div>
                </summary>
                <div className="phase-body">
                  <p className="muted">{phase.summary}</p>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Task</th>
                          <th>Trade</th>
                          <th>Days</th>
                          <th>Crew</th>
                          <th>Depends on</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phase.tasks.map((task) => (
                          <tr key={task.id}>
                            <td className="mono">{task.id}</td>
                            <td>{task.name}</td>
                            <td>{task.trade}</td>
                            <td>{task.duration_days}</td>
                            <td>{task.crew_size}</td>
                            <td className="mono">{task.depends_on.join(", ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </Card>

      <div className="split-results">
        <Card title="Milestones" subtitle="Key gates and deliverables.">
          <div className="milestones">
            {data.milestones.map((milestone) => (
              <div className="milestone" key={milestone.name}>
                <div className="milestone-marker">
                  <Flag size={14} />
                </div>
                <div>
                  <strong>{milestone.name}</strong>
                  <span>
                    Day {milestone.day}
                    {dayLabel(startDate, milestone.day)
                      ? ` · ${dayLabel(startDate, milestone.day)}`
                      : ""}
                  </span>
                  <p>{milestone.deliverable}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Critical path" subtitle="Zero-float sequence to protect.">
          <div className="chip-list">
            {data.critical_path.map((id) => (
              <span className="chip" key={id}>
                <GitBranch size={12} />
                <span className="mono">{id}</span>
                {taskNames.get(id)}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="split-results">
        <Card title="Resource loading" subtitle="Indicative allocation across the programme.">
          <div className="resource-list">
            {data.resource_plan.map((resource) => (
              <div className="resource" key={resource.role}>
                <div>
                  <Users size={14} />
                  <span>{resource.role}</span>
                </div>
                <strong>{resource.headcount}</strong>
                <span className="muted small">{formatNumber(resource.allocation_weeks, 1)} wks</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Budget breakdown" subtitle="Percentage allocation of the supplied budget.">
          <div className="budget-list">
            {data.budget_breakdown.map((line) => (
              <div className="budget-row" key={line.category}>
                <div className="budget-head">
                  <span>{line.category}</span>
                  <strong>
                    {line.percent}%{line.amount !== null ? ` · ${formatCurrency(line.amount, currency)}` : ""}
                  </strong>
                </div>
                <div className="progress subtle">
                  <span style={{ width: `${line.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="budget-total">
            <CircleDollarSign size={15} />
            <span>Total planned</span>
            <strong>{formatCurrency(budgetTotal, currency)}</strong>
          </div>
        </Card>
      </div>

      <Card title="Risk register" subtitle="Probability, impact, and mitigation.">
        <div className="risk-grid">
          {data.risks.map((risk) => (
            <article className="risk-card" key={risk.title}>
              <div className="risk-head">
                <h3>{risk.title}</h3>
                <div className="risk-badges">
                  <Badge
                    tone={
                      risk.probability === "high"
                        ? "red"
                        : risk.probability === "medium"
                          ? "amber"
                          : "slate"
                    }
                  >
                    P · {titleCase(risk.probability)}
                  </Badge>
                  <Badge
                    tone={
                      risk.impact === "high"
                        ? "red"
                        : risk.impact === "medium"
                          ? "amber"
                          : "slate"
                    }
                  >
                    I · {titleCase(risk.impact)}
                  </Badge>
                </div>
              </div>
              <p>{risk.mitigation}</p>
            </article>
          ))}
        </div>
      </Card>

      <div className="split-results">
        <Card title="Assumptions" subtitle="Validate these before committing the programme.">
          <BulletList items={data.assumptions} />
        </Card>
        <Card title="Planning checks">
          <div className="check-list">
            <span>
              <Layers size={15} /> {data.phases.length} phases sequenced
            </span>
            <span>
              <GitBranch size={15} /> {data.critical_path.length} critical tasks
            </span>
            <span>
              <Flag size={15} /> {data.milestones.length} milestones
            </span>
            <span>
              <Users size={15} /> {data.resource_plan.length} resource groups
            </span>
          </div>
        </Card>
      </div>

      <Card title="Response metadata" subtitle="Contract provenance and quality signals.">
        <MetaBar meta={data.meta} />
        <JsonViewer data={data} />
      </Card>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  HardHat,
  ShieldAlert,
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
  ConfidenceBar,
  EmptyState,
  Field,
  ImageDropzone,
  JsonViewer,
  LoadingResult,
  MetaBar,
  PageHeader,
  SeverityBadge,
  Stat,
  TextArea,
} from "../components/ui";
import { useAsyncAction } from "../lib/useAsyncAction";
import { titleCase } from "../lib/format";
import type { SafetyResponse } from "../types";

export default function SafetyMonitor() {
  const [image, setImage] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const { data, loading, error, run } = useAsyncAction<SafetyResponse>();
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!image) {
      setFormError("Attach a site photo to run the audit.");
      return;
    }
    setFormError(null);
    await run(() => api.safety(image, notes));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Vision · Safety"
        title="Site Safety Monitor"
        description="Upload a site photo to surface hazards, check PPE compliance, and get prioritized corrective actions with a clear risk rating."
        actions={<Badge tone="amber">Image + context</Badge>}
      />

      <div className="workspace">
        <Card title="Site evidence" subtitle="A clear, well-lit wide shot works best.">
          <form onSubmit={submit} className="form-stack">
            <ImageDropzone
              file={image}
              onChange={(file) => {
                setImage(file);
                setFormError(null);
              }}
              label="Site photo"
            />
            <Field
              label="Supervisor notes"
              htmlFor="safety-notes"
              hint="Optional context: level, trade, shift, known issues."
            >
              <TextArea
                id="safety-notes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Level 2 slab edge, formwork crew active, afternoon shift..."
              />
            </Field>
            <Alert tone="info">
              The model reports only what is visible or supported by your notes. Use the
              findings to direct a human walk, not to replace it.
            </Alert>
            {formError ? <Alert tone="danger">{formError}</Alert> : null}
            <Button type="submit" loading={loading} icon={<ShieldAlert size={16} />} full>
              Run safety audit
            </Button>
          </form>
        </Card>

        <div className="result-column">
          {error ? (
            <Alert tone="danger" title="Audit failed">
              {error}
            </Alert>
          ) : null}
          {loading ? (
            <Card>
              <LoadingResult label="Auditing the site" />
            </Card>
          ) : data ? (
            <SafetyResult data={data} />
          ) : (
            <Card>
              <EmptyState
                icon={<ShieldAlert size={26} />}
                title="No audit yet"
                description="Attach a site image and run the audit to see hazards, PPE status, and a compliance score."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SafetyResult({ data }: { data: SafetyResponse }) {
  return (
    <div className="result-stack">
      <Card
        title="Safety audit"
        subtitle={data.summary}
        actions={<SeverityBadge value={data.overall_risk} />}
      >
        <div className="result-stats">
          <div
            className={`score-ring score-${data.overall_risk}`}
            style={{ ["--score" as string]: `${data.compliance_score * 3.6}deg` }}
          >
            <div>
              <strong>{data.compliance_score}%</strong>
              <span>PPE compliance</span>
            </div>
          </div>
          <Stat label="Workers observed" value={data.workers_detected} tone="blue" />
          <Stat
            label="Hazards found"
            value={data.hazards.length}
            hint={`${data.hazards.filter((h) => h.severity === "critical" || h.severity === "high").length} high priority`}
            tone="amber"
          />
        </div>
        <ConfidenceBar confidence={data.confidence} />
        {data.immediate_actions.length > 0 ? (
          <Alert tone="danger" title="Act before the next shift">
            <ol className="number-list">
              {data.immediate_actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
          </Alert>
        ) : null}
      </Card>

      <Card title="Hazards" subtitle="Ordered findings with evidence and controls.">
        <div className="hazard-list">
          {data.hazards.map((hazard) => (
            <article key={hazard.id} className={`hazard hazard-${hazard.severity}`}>
              <div className="hazard-head">
                <div>
                  <span className="hazard-id">
                    {hazard.id} · {hazard.category}
                  </span>
                  <h3>{hazard.title}</h3>
                </div>
                <SeverityBadge value={hazard.severity} />
              </div>
              <p>{hazard.description}</p>
              <div className="hazard-grid">
                <div>
                  <span className="label">Location</span>
                  <p>{hazard.location}</p>
                </div>
                <div>
                  <span className="label">Evidence</span>
                  <p>{hazard.evidence}</p>
                </div>
              </div>
              <div className="hazard-action">
                <AlertTriangle size={15} />
                <div>
                  <span className="label">Corrective action</span>
                  <p>{hazard.recommendation}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <div className="split-results">
        <Card title="PPE check" subtitle="Visual status per item.">
          <div className="ppe-grid">
            {data.ppe_items.map((item) => (
              <div key={item.name} className="ppe-item">
                <div>
                  <HardHat size={15} />
                  <span>{item.name}</span>
                </div>
                <Badge
                  tone={
                    item.status === "detected"
                      ? "green"
                      : item.status === "not_detected"
                        ? "red"
                        : "slate"
                  }
                  dot
                >
                  {titleCase(item.status)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recommendations" subtitle="Systemic improvements to close out.">
          <BulletList items={data.recommendations} />
        </Card>
      </div>

      <Card title="Response metadata" subtitle="Contract provenance and quality signals.">
        <MetaBar meta={data.meta} />
        <div className="compliance-footer">
          <Users size={15} />
          <span>
            Human verification required. Confirm findings on site and record close-out
            evidence.
          </span>
          <ShieldCheck size={15} />
        </div>
        <JsonViewer data={data} />
      </Card>
    </div>
  );
}

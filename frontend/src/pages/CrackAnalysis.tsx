import { useState, type FormEvent } from "react";
import {
  Activity,
  Ruler,
  ScanLine,
  ShieldAlert,
  Wrench,
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
import { formatMoneyRange, formatNumber, titleCase } from "../lib/format";
import type { CrackResponse, Urgency } from "../types";

const urgencyTone: Record<Urgency, "green" | "amber" | "red" | "slate"> = {
  monitor: "green",
  schedule: "amber",
  urgent: "red",
  immediate: "red",
};

export default function CrackAnalysis() {
  const [image, setImage] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { data, loading, error, run } = useAsyncAction<CrackResponse>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!image) {
      setFormError("Attach a close-up image of the crack.");
      return;
    }
    setFormError(null);
    await run(() => api.cracks(image, notes));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Vision · Structural forensics"
        title="Crack Detection & Analysis"
        description="Classify cracking, estimate severity and dimensions, and compare repair options with indicative costs."
        actions={<Badge tone="amber">Image + scale reference</Badge>}
      />

      <div className="workspace">
        <Card title="Crack evidence" subtitle="Include a scale reference where possible.">
          <form onSubmit={submit} className="form-stack">
            <ImageDropzone
              file={image}
              onChange={(file) => {
                setImage(file);
                setFormError(null);
              }}
              label="Crack photo"
              hint="Close-up, in focus, with a ruler or coin if available."
            />
            <Field
              label="Inspector notes"
              htmlFor="crack-notes"
              hint="Element, location, age, movement history, water ingress."
            >
              <TextArea
                id="crack-notes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Diagonal crack at the basement retaining wall, first noticed after heavy rain..."
              />
            </Field>
            <Alert tone="info">
              Dimensions are only estimated when a scale is visible. Any crack affecting
              primary structure needs a licensed engineer's review.
            </Alert>
            {formError ? <Alert tone="danger">{formError}</Alert> : null}
            <Button type="submit" loading={loading} icon={<ScanLine size={16} />} full>
              Analyze crack
            </Button>
          </form>
        </Card>

        <div className="result-column">
          {error ? (
            <Alert tone="danger" title="Analysis failed">
              {error}
            </Alert>
          ) : null}
          {loading ? (
            <Card>
              <LoadingResult label="Reading the defect" />
            </Card>
          ) : data ? (
            <CrackResult data={data} />
          ) : (
            <Card>
              <EmptyState
                icon={<ScanLine size={26} />}
                title="No assessment yet"
                description="Upload a crack photo to see classification, severity, likely cause, and repair options."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CrackResult({ data }: { data: CrackResponse }) {
  const dimensions = [
    {
      label: "Width",
      value: data.dimensions.width_mm,
      suffix: "mm",
    },
    {
      label: "Length",
      value: data.dimensions.length_cm,
      suffix: "cm",
    },
    {
      label: "Est. depth",
      value: data.dimensions.estimated_depth_mm,
      suffix: "mm",
    },
  ];

  return (
    <div className="result-stack">
      <Card
        title={data.crack_detected ? "Crack assessment" : "No crack identified"}
        subtitle={data.location}
        actions={
          data.crack_detected ? (
            <SeverityBadge value={data.severity} />
          ) : (
            <Badge tone="green" dot>
              Clear
            </Badge>
          )
        }
      >
        {!data.crack_detected ? (
          <Alert tone="success" title="No actionable cracking observed">
            {data.structural_assessment}
          </Alert>
        ) : (
          <>
            <div className="result-stats four">
              <Stat
                label="Severity score"
                value={`${data.severity_score}/100`}
                tone={
                  data.severity === "critical" || data.severity === "high"
                    ? "red"
                    : data.severity === "medium"
                      ? "amber"
                      : "green"
                }
                hint={titleCase(data.crack_type ?? "unknown")}
              />
              <Stat
                label="Urgency"
                value={titleCase(data.urgency)}
                tone={data.urgency === "immediate" || data.urgency === "urgent" ? "red" : "amber"}
              />
              <Stat
                label="Repair estimate"
                value={formatMoneyRange(data.estimated_repair_cost)}
                hint="Indicative, not a quotation"
              />
              <Stat
                label="Crack family"
                value={titleCase(data.crack_type ?? "unknown")}
                hint="Probable mechanism"
                tone="blue"
              />
            </div>

            <div className="dimension-strip">
              {dimensions.map((dimension) => (
                <div key={dimension.label} className="dimension">
                  <Ruler size={15} />
                  <span>{dimension.label}</span>
                  <strong>
                    {dimension.value === null
                      ? "Not measurable"
                      : `${formatNumber(dimension.value, 1)} ${dimension.suffix}`}
                  </strong>
                </div>
              ))}
            </div>

            <ConfidenceBar confidence={data.confidence} />
          </>
        )}
      </Card>

      <div className="split-results">
        <Card title="Likely cause" subtitle="Forensic hypothesis">
          <p className="body-copy">{data.probable_cause}</p>
        </Card>
        <Card title="Structural assessment" subtitle="Engineering read-out">
          <p className="body-copy">{data.structural_assessment}</p>
          <Badge tone={urgencyTone[data.urgency]} dot>
            <Activity size={12} /> {titleCase(data.urgency)}
          </Badge>
        </Card>
      </div>

      {data.repair_options.length > 0 ? (
        <Card title="Repair options" subtitle="Compare method, cost, and service life.">
          <div className="repair-list">
            {data.repair_options.map((option) => (
              <article key={option.method} className="repair-card">
                <div className="repair-head">
                  <div>
                    <Wrench size={16} />
                    <h3>{option.method}</h3>
                  </div>
                  <strong>{formatMoneyRange(option.estimated_cost)}</strong>
                </div>
                <p>{option.description}</p>
                <span className="muted small">
                  Expected service life:{" "}
                  {option.lifespan_years ? `${option.lifespan_years} years` : "not stated"}
                </span>
              </article>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="split-results">
        <Card title="Monitoring plan" subtitle="Track movement before and after repair.">
          <BulletList items={data.monitoring_plan} />
        </Card>
        <Card title="Recommendations" subtitle="Next best actions.">
          <BulletList items={data.recommendations} />
        </Card>
      </div>

      {data.urgency === "immediate" || data.urgency === "urgent" ? (
        <Alert tone="danger" title="Escalate this defect">
          <ShieldAlert size={15} /> Restrict access and engage a structural engineer before
          loading the affected element.
        </Alert>
      ) : null}

      <Card title="Response metadata" subtitle="Contract provenance and quality signals.">
        <MetaBar meta={data.meta} />
        <JsonViewer data={data} />
      </Card>
    </div>
  );
}

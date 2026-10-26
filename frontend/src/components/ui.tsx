import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type DragEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FileJson,
  ImageIcon,
  Info,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

import type { Confidence, ResponseMeta, Severity, Source } from "../types";
import { formatDateTime, titleCase } from "../lib/format";

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  accent,
}: CardProps) {
  return (
    <section className={cx("card", accent && "card-accent", className)}>
      {title || actions ? (
        <div className="card-header">
          <div>
            {title ? <h2 className="card-title">{title}</h2> : null}
            {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cx("field", className)}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
      {!error && hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={cx("input", className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={cx("input textarea", className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select {...rest} className={cx("input select", className)}>
      {children}
    </select>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
}

export function Button({
  variant = "primary",
  loading,
  icon,
  full,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx("btn", `btn-${variant}`, full && "btn-full", className)}
      disabled={disabled || loading}
    >
      {loading ? <Loader2 className="spin" size={16} /> : icon}
      {children}
    </button>
  );
}

type Tone = "neutral" | "amber" | "green" | "red" | "blue" | "purple" | "slate";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, tone = "neutral", dot, className }: BadgeProps) {
  return (
    <span className={cx("badge", `badge-${tone}`, className)}>
      {dot ? <span className="badge-dot" /> : null}
      {children}
    </span>
  );
}

const severityTone: Record<Severity, Tone> = {
  low: "green",
  medium: "amber",
  high: "red",
  critical: "red",
};

export function SeverityBadge({ value }: { value: Severity }) {
  return (
    <Badge tone={severityTone[value]} dot>
      {titleCase(value)}
    </Badge>
  );
}

export function ConfidenceBar({ confidence }: { confidence: Confidence }) {
  const percent = Math.round(confidence.score * 100);
  return (
    <div className="confidence">
      <div className="confidence-head">
        <span>Model confidence</span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress">
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="muted small">{confidence.rationale}</p>
    </div>
  );
}

const sourceLabel: Record<Source, string> = {
  gemini: "Gemini live",
  mock: "Demo engine",
};

export function MetaBar({ meta }: { meta: ResponseMeta }) {
  return (
    <div className="meta-block">
      <div className="meta-bar">
        <Badge tone={meta.source === "gemini" ? "green" : "amber"} dot>
          {sourceLabel[meta.source]}
        </Badge>
        <span>{meta.model ?? "unknown model"}</span>
        <span>{meta.latency_ms} ms</span>
        <span>{formatDateTime(meta.generated_at)}</span>
      </div>
      {meta.warnings.length > 0 ? (
        <details className="meta-warnings">
          <summary>
            <AlertTriangle size={13} /> {meta.warnings.length} notice
            {meta.warnings.length > 1 ? "s" : ""}
          </summary>
          <ul>
            {meta.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "amber" | "green" | "red" | "blue";
}

export function Stat({ label, value, hint, tone = "default" }: StatProps) {
  return (
    <div className={cx("stat", `stat-${tone}`)}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </div>
  );
}

interface AlertProps {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
}

export function Alert({ tone = "info", title, children }: AlertProps) {
  const Icon =
    tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle;
  return (
    <div className={cx("alert", `alert-${tone}`)}>
      <Icon size={18} className="alert-icon" />
      <div>
        {title ? <strong>{title}</strong> : null}
        <div className="alert-body">{children}</div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon ?? <Sparkles size={26} />}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function LoadingResult({ label = "Analyzing" }: { label?: string }) {
  return (
    <div className="loading-result">
      <div className="loading-orbit">
        <Loader2 className="spin" size={26} />
      </div>
      <strong>{label}</strong>
      <p className="muted small">
        Running multimodal reasoning and validating the JSON contract.
      </p>
      <div className="skeleton-lines">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function JsonViewer({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <details className="json-viewer">
      <summary>
        <FileJson size={15} />
        View raw JSON contract
        <span className="json-size">{Math.round(json.length / 1024)} KB</span>
      </summary>
      <div className="json-body">
        <button type="button" className="json-copy" onClick={copy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <pre>{json}</pre>
      </div>
    </details>
  );
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

interface ImageDropzoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  optional?: boolean;
  label?: string;
  hint?: string;
}

export function ImageDropzone({
  file,
  onChange,
  optional,
  label = "Site image",
  hint = "PNG, JPEG or WebP · up to 8 MB",
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputId = useId();

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function accept(candidate: File | undefined) {
    if (!candidate) return;
    if (!ACCEPTED.includes(candidate.type)) {
      setError("Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError("Image is larger than 8 MB.");
      return;
    }
    setError(null);
    onChange(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  }

  function clear() {
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label} {optional ? <span className="optional">optional</span> : null}
      </label>
      {file && preview ? (
        <div className="image-preview">
          <img src={preview} alt="Selected upload preview" />
          <div className="image-preview-meta">
            <span>{file.name}</span>
            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <button type="button" className="image-remove" onClick={clear} aria-label="Remove image">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={cx("dropzone", dragging && "dropzone-active")}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="dropzone-icon">
            {dragging ? <ImageIcon size={24} /> : <UploadCloud size={24} />}
          </div>
          <strong>Drop an image here or browse</strong>
          <span>{hint}</span>
        </div>
      )}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(event) => accept(event.target.files?.[0])}
      />
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="bullet-list">
      {items.map((item) => (
        <li key={item}>
          <Check size={14} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

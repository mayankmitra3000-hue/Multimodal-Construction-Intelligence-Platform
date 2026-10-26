import { useState, type FormEvent } from "react";
import {
  BookOpenCheck,
  FileText,
  GraduationCap,
  ImageIcon,
  ShieldAlert,
  Sparkles,
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
  Select,
  TextArea,
} from "../components/ui";
import { useAsyncAction } from "../lib/useAsyncAction";
import { titleCase } from "../lib/format";
import type { Discipline, KnowledgeResponse } from "../types";

const disciplines: Discipline[] = [
  "general",
  "structural",
  "safety",
  "mep",
  "architecture",
  "estimating",
  "scheduling",
];

const suggestions = [
  "How should I cure a large concrete slab in hot weather?",
  "What are the hold points before closing formwork?",
  "How do I assess a settlement crack in a retaining wall?",
  "What belongs in a daily site report?",
];

export default function KnowledgeAssistant() {
  const [question, setQuestion] = useState(
    "What causes honeycombing in concrete and how should it be repaired?",
  );
  const [discipline, setDiscipline] = useState<Discipline>("structural");
  const [image, setImage] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { data, loading, error, run } = useAsyncAction<KnowledgeResponse>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (question.trim().length < 5) {
      setFormError("Ask a question with at least five characters.");
      return;
    }
    setFormError(null);
    await run(() => api.knowledge(question.trim(), discipline, image));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Text + image · Knowledge"
        title="Construction Knowledge Assistant"
        description="Ask practical construction questions and attach a reference photo for image-grounded guidance, codes, and safety notes."
        actions={<Badge tone="purple">Guidance, not sign-off</Badge>}
      />

      <div className="workspace">
        <Card title="Ask the assistant" subtitle="Frame the question with the decision you need to make.">
          <form onSubmit={submit} className="form-stack">
            <Field label="Question" htmlFor="knowledge-question">
              <TextArea
                id="knowledge-question"
                rows={5}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What should I check before accepting this concrete pour?"
              />
            </Field>
            <Field label="Discipline" htmlFor="knowledge-discipline">
              <Select
                id="knowledge-discipline"
                value={discipline}
                onChange={(event) => setDiscipline(event.target.value as Discipline)}
              >
                {disciplines.map((item) => (
                  <option value={item} key={item}>
                    {titleCase(item)}
                  </option>
                ))}
              </Select>
            </Field>
            <ImageDropzone
              file={image}
              onChange={setImage}
              optional
              label="Reference image"
              hint="Optional: defect, detail, or site condition."
            />
            <div className="suggestion-list">
              {suggestions.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="suggestion"
                  onClick={() => setQuestion(item)}
                >
                  <Sparkles size={12} />
                  {item}
                </button>
              ))}
            </div>
            {formError ? <Alert tone="danger">{formError}</Alert> : null}
            <Button type="submit" loading={loading} icon={<GraduationCap size={16} />} full>
              Ask the assistant
            </Button>
          </form>
        </Card>

        <div className="result-column">
          {error ? (
            <Alert tone="danger" title="Question failed">
              {error}
            </Alert>
          ) : null}
          {loading ? (
            <Card>
              <LoadingResult label="Researching the answer" />
            </Card>
          ) : data ? (
            <KnowledgeResult data={data} />
          ) : (
            <Card>
              <EmptyState
                icon={<BookOpenCheck size={26} />}
                title="Ask your first question"
                description="Get a structured answer with key points, applicable codes, safety notes, and related topics."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function KnowledgeResult({ data }: { data: KnowledgeResponse }) {
  return (
    <div className="result-stack">
      <Card
        title="Answer"
        subtitle="Practical guidance grounded in construction practice."
        actions={
          <Badge tone={data.image_analyzed ? "green" : "slate"}>
            <ImageIcon size={12} />
            {data.image_analyzed ? "Image analyzed" : "Text only"}
          </Badge>
        }
      >
        <p className="answer-copy">{data.answer}</p>
        <ConfidenceBar confidence={data.confidence} />
      </Card>

      <div className="split-results">
        <Card title="Key points" subtitle="What to remember.">
          <BulletList items={data.key_points} />
        </Card>
        <Card title="Applicable codes" subtitle="Generic references; local editions govern.">
          <div className="code-list">
            {data.applicable_codes.map((code) => (
              <div key={code}>
                <FileText size={14} />
                <span>{code}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Safety notes" subtitle="Do not skip these controls.">
        <div className="icon-list">
          {data.safety_notes.map((note) => (
            <div key={note}>
              <ShieldAlert size={14} />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="split-results">
        <Card title="Related topics" subtitle="Continue the research.">
          <div className="chip-list">
            {data.related_topics.map((topic) => (
              <span className="chip" key={topic}>
                {topic}
              </span>
            ))}
          </div>
        </Card>
        <Card title="Professional disclaimer">
          <p className="body-copy">{data.disclaimer}</p>
        </Card>
      </div>

      <Card title="Response metadata" subtitle="Contract provenance and quality signals.">
        <MetaBar meta={data.meta} />
        <JsonViewer data={data} />
      </Card>
    </div>
  );
}

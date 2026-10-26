# BuildSense AI — Multimodal Construction Intelligence Platform

A full-stack decision-support workspace for construction teams. It reads site photos,
daily logs, property attributes, and project briefs, then returns structured safety,
defect, valuation, schedule, and knowledge outputs.

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** FastAPI + Pydantic v2
- **AI:** Google Gemini (multimodal) with a deterministic offline demo engine
- **Contract:** every response is schema-validated and includes a `meta` telemetry block

## Feature set

| Workspace | Input | Output |
| --- | --- | --- |
| Site Safety Monitor | image + notes | hazards, PPE status, compliance score, corrective actions |
| Crack Detection | image + notes | crack type, severity, dimensions, cause, repair options, cost range |
| Real Estate Valuation | structured attributes | value range, price/m², factor weights, market outlook |
| Project Planning | project brief | phases, tasks, dependencies, milestones, critical path, resources, budget, risks |
| Daily Site Assistant | raw site log | executive summary, issues, owned actions, safety notes, next-day focus |
| Weather Advisory | location + activities | estimated outlook, activity suitability, advisories, schedule impact |
| Knowledge Assistant | question + optional image | answer, key points, applicable codes, safety notes, disclaimer |

## Architecture

```
React + Vite (port 5173)
        │  typed fetch · /api proxy
        ▼
FastAPI (port 8000)
        │
        ├── Pydantic request/response contracts
        ├── upload validation (PNG/JPEG/WebP, 8 MB)
        ├── AI service
        │      ├── Gemini provider (response_mime_type=application/json)
        │      ├── schema validation + one corrective retry
        │      └── deterministic mock fallback (auto mode)
        └── ResponseMeta (source, model, latency, warnings)
```

The backend never returns unvalidated model output. Generated JSON is stripped of
markdown fences, validated against the endpoint's Pydantic model, and retried once with
the validation error if needed. In `auto` mode, a provider failure can fall back to demo
data with an explicit warning, so the UI remains usable.

## Repository layout

```
backend/
  app/
    ai/          provider wrapper, prompts, retry/validation service
    routers/     one router per feature + health/features metadata
    schemas/     strict request/response contracts
    services/    image validation, deterministic demo engine
  tests/         smoke tests for all seven contracts
  requirements.txt
  .env.example
frontend/
  src/
    api/         typed API client
    components/  layout and UI primitives
    lib/         formatting and async-action helpers
    pages/       dashboard + seven workspaces
    types.ts     TypeScript mirror of backend contracts
  vite.config.ts
```

## Quick start

Requires **Python 3.11+** and **Node 20+**.

### 1. Backend

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

The app runs immediately in demo mode with no API key. For live Gemini analysis, edit
`backend/.env`:

```dotenv
AI_MODE=auto
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
```

Start the API:

```powershell
uvicorn app.main:app --reload --port 8000
```

- API docs: <http://127.0.0.1:8000/docs>
- Health: <http://127.0.0.1:8000/api/health>

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. Vite proxies `/api` to port 8000.

### AI modes

| `AI_MODE` | Behaviour |
| --- | --- |
| `auto` (default) | Use Gemini when `GEMINI_API_KEY` exists; otherwise deterministic demo mode |
| `gemini` | Require Gemini; return HTTP 502 if the provider cannot produce valid JSON |
| `mock` | Always use the deterministic demo engine |

Demo responses are internally consistent (schedules, budgets, value ranges, dimensions)
but they are **not** real inference. The UI labels the source in the response metadata.

## API

All endpoints are prefixed with `/api`.

| Method | Endpoint | Content type |
| --- | --- | --- |
| GET | `/api/health` | — |
| GET | `/api/features` | — |
| POST | `/api/safety/analyze` | multipart (`image`, `notes`) |
| POST | `/api/cracks/analyze` | multipart (`image`, `notes`) |
| POST | `/api/valuation/estimate` | JSON |
| POST | `/api/planning/generate` | JSON |
| POST | `/api/daily/summarize` | JSON |
| POST | `/api/weather/advisory` | JSON |
| POST | `/api/knowledge/ask` | multipart (`question`, `discipline`, optional `image`) |

Every successful feature response includes:

```json
{
  "meta": {
    "source": "gemini",
    "model": "gemini-2.5-flash",
    "generated_at": "2026-01-01T12:00:00Z",
    "latency_ms": 1840,
    "warnings": []
  }
}
```

Errors are normalized where possible:

- `422` `{"detail": "...", "code": "validation_error", "errors": [...]}`
- `415` unsupported image format
- `413` image too large
- `502` `{"detail": "...", "code": "ai_provider_error"}`

## Contracts and frontend types

Backend contracts live in `backend/app/schemas/` and are exposed through OpenAPI at
`/openapi.json`. The TypeScript mirror is `frontend/src/types.ts`. When you change a
schema, update that file as well.

## Testing and builds

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
```

```powershell
cd frontend
npm run typecheck
npm run build
```

The backend test suite runs all seven endpoints in demo mode, including the no-crack path,
knowledge without an image, upload rejection, and validation errors.

## Deploying

Build the frontend with `npm run build` and host `frontend/dist` on any static host. Set
`VITE_API_BASE_URL` at build time to the public API origin, and add that frontend origin to
`CORS_ORIGINS` in the backend environment.

## Limitations

- Image findings are decision support, not a stamped inspection or engineering opinion.
- Weather output is AI-estimated, not a live meteorological feed.
- Valuation output is indicative and excludes title, zoning, and structural due diligence.
- There is no authentication, database, or saved history in this MVP; all endpoints are
  stateless.

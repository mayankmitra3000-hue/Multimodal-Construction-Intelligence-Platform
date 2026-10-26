# 🏗️ AI-Powered Multimodal Construction Intelligence Platform

An AI-driven, full-stack construction intelligence platform that combines computer vision, natural language processing, and project data analysis to support construction planning, site safety, defect assessment, and informed decision-making.

## 📌 Overview

The **Multimodal Construction Intelligence Platform** enables construction professionals to interact with AI using text, images, and structured project information. It integrates a React.js frontend with a FastAPI backend and a multimodal Large Language Model (LLM) to deliver context-aware insights through structured JSON responses.

The platform aims to simplify construction workflows, improve access to technical knowledge, and assist professionals in identifying potential risks and planning construction activities.

## ✨ Key Features

- **Construction Site Safety Monitoring:** Analyze site images to identify potential hazards and unsafe working conditions.
- **Crack Detection and Analysis:** Examine visible cracks in construction images and provide preliminary observations about their characteristics and possible severity.
- **Real Estate Valuation:** Generate estimated property valuations using available property details and relevant market information.
- **Construction Project Planning:** Assist with project schedules, material planning, resource allocation, and execution strategies.
- **Daily Site Assistance:** Provide guidance for routine construction activities, inspections, and site management.
- **Weather-Aware Advisory:** Generate weather-informed construction recommendations when reliable weather data is available.
- **Construction Knowledge Assistant:** Answer construction-related questions using natural language.
- **Structured AI Responses:** Use JSON-based response contracts to support predictable frontend-backend communication.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python, FastAPI |
| AI Integration | Multimodal Large Language Model |
| Communication | REST APIs, JSON |
| Image Processing | Image handling and model-based visual analysis |
| Development Tools | Git, GitHub, npm, Python |

*Adjust this list to reflect the libraries, AI provider, database, and services actually used in your implementation.*

## 🏛️ System Architecture

```text
          User
           |
           v
    React.js Frontend
           |
           | REST API / JSON
           v
      FastAPI Backend
           |
     Input Validation
           |
           v
   Multimodal AI Model
      /     |      \
   Text   Images   Project Data
           |
           v
   Structured AI Response
           |
           v
    React.js Frontend
           |
           v
   Insights and Recommendations
```

## 🚀 Getting Started

### Prerequisites

Install the following before running the application:

- Node.js and npm
- Python 3.10 or a version compatible with your dependencies
- pip
- Git
- An API key for the selected AI provider, if required

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```bash
venv\Scripts\activate
```

**Linux/macOS:**

```bash
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the backend directory and configure the environment variables required by your AI provider.

Example:

```env
AI_API_KEY=your_api_key_here
```

Use the actual variable names expected by your application. Never commit API keys or other secrets to GitHub.

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

This command assumes your FastAPI application instance is named `app` in `main.py`. Adjust the module path if your project uses a different entry point.

Access the API documentation at:

`http://127.0.0.1:8000/docs`

### 3. Configure the Frontend

Open a separate terminal and navigate to the frontend directory:

```bash
>>>>>>> b593f733e366b555779c56c9627e5816c5f2bd5f
cd frontend
npm install
npm run dev
```

<<<<<<< HEAD
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
=======
Open the local URL displayed by your development server.

*The commands above assume the project uses the standard Vite development setup and has separate `frontend` and `backend` directories.*

## 📂 Suggested Project Structure

```text
construction-intelligence-platform/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── main.py
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── utils/
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

This is a suggested structure; adapt it to the actual repository.

## 🔄 Application Workflow

1. The user selects a construction feature and submits text, images, or project information.
2. The React.js frontend sends the request to the relevant FastAPI endpoint.
3. The backend validates the input and prepares the request for AI processing.
4. The multimodal AI model analyzes the supplied information.
5. The backend validates and returns the response in the expected JSON format.
6. The frontend displays the analysis, findings, and recommendations.

## 🔐 Security and Reliability

- Store credentials in environment variables.
- Validate uploaded files and restrict acceptable file types and sizes.
- Handle API failures, invalid inputs, and malformed AI responses.
- Apply suitable authentication, authorization, and rate limiting when required.
- Avoid presenting AI-generated structural assessments as certified engineering conclusions.

## ⚠️ Limitations

AI-generated outputs may be incomplete or inaccurate. Image-based crack analysis cannot independently establish structural integrity, and property valuations depend on the quality and availability of relevant data. Safety-critical findings must be verified by qualified professionals.

## 🔮 Future Enhancements

- Real-time construction progress monitoring
- Project database and historical records
- Construction dashboards and analytics
- Automated inspection reports in PDF format
- Weather API integration
- Material cost estimation and budget tracking
- Role-based access control
- Predictive maintenance and risk analysis

## 🤝 Contributing

Contributions, feature suggestions, and bug reports are welcome. Fork the repository, create a feature branch, implement your changes, and submit a pull request.

## 📄 License

Choose and add an appropriate open-source license, such as the MIT License, if you intend to distribute the project under those terms.

## 👨‍💻 Author

Mayank Mitra
GitHub: github.com/mayankmitra3000-hue

---

*Building smarter construction workflows through multimodal AI and modern full-stack engineering.*
>>>>>>> b593f733e366b555779c56c9627e5816c5f2bd5f

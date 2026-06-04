# AI Healthcare Triage Assistant

Full-stack GenAI healthcare triage platform with symptom intake, retrieval-augmented context, urgency classification, report analysis hooks, hospital lookup, multilingual-ready responses, and audit logging.

## Tech Stack

- Frontend: React, Tailwind CSS, Axios, React Router
- Backend: Node.js, Express, JWT-ready middleware structure
- Database: MongoDB for audit logs
- Vector/RAG: LangChain + ChromaDB integration point with local keyword fallback
- AI Model: GPT/Gemini-ready provider hooks

## Run Locally

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

Copy `backend/.env.example` to `backend/.env` or set environment variables before running the backend.

## Production Integrations

Authentication:

```bash
POST /api/auth/register
POST /api/auth/login
```

The triage endpoint requires a JWT bearer token.

MongoDB:

- Stores users.
- Stores audit logs.
- Audit user input is encrypted when `AUDIT_ENCRYPTION_KEY` is configured.

ChromaDB and LangChain:

```bash
cd backend
npm run seed:chroma
```

The API first attempts Chroma similarity search through LangChain. If Chroma or embeddings are not configured, it falls back to the local seeded medical knowledge.

LLM enrichment:

- Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY`, or
- Set `LLM_PROVIDER=gemini` and `GEMINI_API_KEY`.

Without keys, the deterministic risk engine is used.

## API

`POST /api/triage`

Accepts patient demographics, medical history, symptoms, duration, severity, retrieved context, and notes. Returns the required JSON response shape with patient summary, retrieved context, risk assessment, possible conditions, recommendations, doctor visit guidance, safety disclaimer, and audit log metadata.

## Medical Safety

This assistant does not diagnose, prescribe medication, alter dosages, or replace professional medical advice. Emergency symptoms are classified conservatively and routed to immediate care instructions.

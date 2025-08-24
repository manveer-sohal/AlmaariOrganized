# Backend (Express) — Deploy & Run

Host: _Google Cloud Run_ (Docker image)
Region: _northamerica-northeast1_
Service name: _almari-api_
Artifact Registry repo: _app_

## 1. Prerequisites

- Node.js 20+ for local dev.
- Google Cloud CLI (gcloud) authenticated and a project selected:

```
gcloud auth login
gcloud config set project <PROJECT_ID>          # e.g. wired-glider-415011
gcloud config set run/region northamerica-northeast1
```

- Artifact Registry repo created once:

```
gcloud artifacts repositories create app \
  --repository-format=docker \
  --location northamerica-northeast1
```

## 2. Environment Variables

Create backend/env.yaml (do not commit secrets):

```
MONGODB_URI: "mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"
REDIS_URL: "rediss://default:<UPSTASH_RW_TOKEN>@<host>:6379"
CORS_ORIGIN: "https://almaari-organized.vercel.app,http://localhost:3000"
```

## 3. Local Development

### A. Run directly

```
cd backend
npm install
PORT=3001 
npm run dev
```

- Health routes: GET /health (and /_ah/health).

```
cd frontend
npm install
PORT=3000
npm run dev
```

### B. Use Docker

In base direcoty
```
docker compose up --build
```

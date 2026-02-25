# AI Interviewer

AI-powered text interview screening agent. Automate your initial candidate filtering with AI-generated questions and instant evaluations.

## Features

- **Create Interview**: HR inputs job requirements, AI generates screening questions
- **Candidate Portal**: Simple text-based interview, no video required
- **AI Evaluation**: Instant scoring and recommendations
- **Results Dashboard**: View all candidates ranked by performance

## Quick Start

```bash
# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start with Docker
docker compose up -d

# Open http://localhost:30200
```

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Python 3.12 + FastAPI + SQLite
- **AI**: LLM Proxy (Claude/GPT)
- **Payment**: Creem

## Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## License

MIT

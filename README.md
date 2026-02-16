# Trading Platform

A comprehensive trading and finance web application built with Python FastAPI (backend) and Next.js (frontend).

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, PostgreSQL
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Testing**: pytest (backend), Jest + React Testing Library (frontend), Playwright (E2E)

## Project Structure

```
project-makemoney/
├── .claude/                 # Claude agent harness files
│   ├── feature_list.json   # Comprehensive feature list
│   ├── claude-progress.txt # Progress tracking log
│   ├── session_context.json # Session state
│   ├── agent_prompts/      # Agent instructions
│   └── testing_helpers.py # Testing utilities
├── backend/                # Python FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   └── core/          # Core configuration
│   ├── tests/            # Backend tests
│   ├── requirements.txt
│   └── init.sh           # Backend initialization
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/         # Next.js app directory
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities
│   │   └── types/       # TypeScript types
│   ├── package.json
│   └── init.sh          # Frontend initialization
└── docker-compose.yml   # Development environment
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker and Docker Compose (optional)

### Using Docker (Recommended)

1. Start all services:
```bash
docker-compose up
```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup

#### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Run the initialization script:
```bash
bash init.sh
```

3. Start the development server:
```bash
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Run the initialization script:
```bash
bash init.sh
```

3. Start the development server:
```bash
npm run dev
```

## Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

### E2E Tests

```bash
cd frontend
npx playwright test
```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation (Swagger UI).

## Development

This project uses a long-running agent harness system for development. See `.claude/agent_prompts/` for details on how the agents work together to incrementally build the application.

### Feature List

The feature list at `.claude/feature_list.json` contains all planned features organized by category. Each feature includes:
- ID and category
- Description
- Implementation steps
- Priority level
- Pass/fail status

### Progress Tracking

Progress is tracked in `.claude/claude-progress.txt`. Each session adds an entry documenting what was completed.

## License

MIT

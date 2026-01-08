# Insightimate

> AI-powered project management for modern teams.

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-10.10.0-F69220?logo=pnpm)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#license)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quickstart (Local)](#quickstart-local)
- [Quickstart (Docker)](#quickstart-docker)
- [Configuration](#configuration)
- [Running](#running)
- [Testing](#testing)
- [API](#api)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Insightimate** is an AI-powered project management platform designed for software development teams and product teams (startups to SMBs). It provides AI-assisted issue triage, planning, estimation, and real-time collaboration through intelligent agents.

---

## Key Features

- **AI Agents** – Specialized agents for different workflows:
  - **Spec Agent** – Breaks down tasks into subtasks
  - **Estimation Agent** – Provides effort estimates
  - **Prioritization Agent** – Helps prioritize issues
  - **Review Agent** – Validates and reviews work
- **Kanban Boards** – Visual project management with drag-and-drop
- **Workspaces & Teams** – Multi-tenant organization structure
- **Projects & Issues** – Full issue tracking with sprints, labels, and priorities
- **Real-time Collaboration** – Socket.io powered live updates
- **Fine-grained Authorization** – Cerbos (ABAC) + OpenFGA (ReBAC) for access control
- **Rich Text Editor** – TipTap-based editor with Markdown support
- **File Uploads** – S3-compatible storage via MinIO

---

## Tech Stack

| Category            | Technology                                              |
| ------------------- | ------------------------------------------------------- |
| **Framework**       | Next.js 15 (App Router)                                 |
| **Frontend**        | React 19, TailwindCSS 4, Radix UI, TanStack Query/Table |
| **Backend**         | Next.js API Routes, Prisma ORM                          |
| **Database**        | PostgreSQL 17 with pgvector                             |
| **AI/LLM**          | Google Gemini, OpenAI, LangChain, Vercel AI SDK         |
| **Authorization**   | Cerbos, OpenFGA                                         |
| **File Storage**    | MinIO (S3-compatible)                                   |
| **Real-time**       | Socket.io                                               |
| **Testing**         | Vitest, Testing Library                                 |
| **Package Manager** | pnpm 10.10.0                                            |

---

## Architecture

```mermaid
graph TB
    subgraph Client
        Browser["Browser (React/Next.js)"]
    end

    subgraph "Next.js App"
        Pages["Pages & Components"]
        API["API Routes (/api/v2, /api/v3)"]
        Middleware["Auth Middleware"]
    end

    subgraph "External Services"
        Postgres["PostgreSQL + pgvector"]
        Cerbos["Cerbos (ABAC)"]
        OpenFGA["OpenFGA (ReBAC)"]
        MinIO["MinIO (S3)"]
        AI["AI Services (Gemini/OpenAI)"]
    end

    Browser --> Pages
    Pages --> API
    API --> Middleware
    Middleware --> Cerbos
    Middleware --> OpenFGA
    API --> Postgres
    API --> MinIO
    API --> AI
```

---

## Prerequisites

- **Node.js** 22.x
- **pnpm** 10.10.0+ (`npm install -g pnpm`)
- **Docker & Docker Compose** (for local services)

---

## Quickstart (Local)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Insightimate
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start infrastructure services**

   ```bash
   docker compose -f scripts/docker/base/docker-compose.yml up -d
   ```

4. **Configure environment**

   ```bash
   cp .env .env.local
   # Edit .env.local with your API keys (see Configuration section)
   ```

5. **Push database schema**

   ```bash
   pnpm prisma:push
   ```

6. **Start development server**

   ```bash
   pnpm dev
   ```

7. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Quickstart (Docker)

Infrastructure services are defined in `scripts/docker/base/docker-compose.yml`:

```bash
# Start all services (PostgreSQL, Cerbos, OpenFGA, MinIO)
docker compose -f scripts/docker/base/docker-compose.yml up -d

# View logs
docker compose -f scripts/docker/base/docker-compose.yml logs -f

# Stop services
docker compose -f scripts/docker/base/docker-compose.yml down
```

### Service Ports

| Service       | Port | Description                |
| ------------- | ---- | -------------------------- |
| PostgreSQL    | 5432 | Main database              |
| Cerbos        | 3592 | Authorization (HTTP)       |
| OpenFGA       | 8080 | Fine-grained authorization |
| MinIO API     | 9000 | S3-compatible storage      |
| MinIO Console | 9001 | MinIO web UI               |

---

## Configuration

### Environment Variables

Create a `.env.local` file based on `.env`:

| Variable                       | Description                  | Default                                                |
| ------------------------------ | ---------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                 | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/postgres` |
| `CERBOS_API_URL`               | Cerbos HTTP endpoint         | `http://localhost:3592`                                |
| `OPENFGA_API_URL`              | OpenFGA HTTP endpoint        | `http://localhost:8080`                                |
| `OPENFGA_STORE_ID`             | OpenFGA store identifier     | (see `.env`)                                           |
| `MINIO_API_URL`                | MinIO S3 endpoint            | `http://localhost:9000`                                |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key        | (required for AI features)                             |
| `OPENAI_API_KEY`               | OpenAI API key               | (optional)                                             |
| `TAVILY_API_KEY`               | Tavily search API key        | (optional)                                             |

### Example `.env.local`

```bash
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable

# Authorization
CERBOS_API_URL=http://localhost:3592
OPENFGA_API_URL=http://localhost:8080
OPENFGA_STORE_ID=01KE1WJ9YDKN0TJJDAXHB198A3

# Storage
MINIO_API_URL=http://localhost:9000

# AI (Required for AI features)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

---

## Running

### Development

```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm dev:clean    # Clear .next cache and start dev server
```

### Production

```bash
pnpm build        # Build for production
pnpm start        # Start production server
```

### Workers (Background Jobs)

```bash
pnpm worker:dev   # Start worker in development (with hot reload)
pnpm worker:start # Start worker in production
```

---

## Testing

```bash
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
pnpm test:ci      # Run tests for CI (no watch, default reporter)
```

### Quality Checks

```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint with auto-fix
pnpm format       # Check formatting with Prettier
pnpm format:fix   # Fix formatting with Prettier
pnpm typecheck    # Run TypeScript type checking
pnpm check        # Run all checks (format + lint + typecheck + test)
pnpm check:fast   # Run fast checks (lint + typecheck only)
```

---

## API

The API is organized under `/api`:

- `/api/v2/*` – Main API endpoints (workspaces, projects, issues, boards, etc.)
- `/api/v3/*` – Newer API endpoints
- `/api/ai/*` – AI-related endpoints
- `/api/system/*` – System endpoints (health, etc.)

### Prisma Studio (Database UI)

```bash
pnpm prisma:studio
```

Opens a visual database browser at [http://localhost:5555](http://localhost:5555).

---

## Project Structure

```
Insightimate/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Public auth pages (login, register)
│   │   ├── (authed)/           # Protected pages
│   │   │   ├── wps/            # Workspace routes
│   │   │   ├── orgs/           # Organization routes
│   │   │   └── user/           # User settings
│   │   └── api/                # API routes
│   │       ├── v2/             # Main API (v2)
│   │       ├── v3/             # API (v3)
│   │       └── ai/             # AI endpoints
│   ├── components/             # Shared UI components
│   ├── features/               # Feature modules
│   │   ├── agents/             # AI agents (spec, estimation, etc.)
│   │   ├── boards/             # Kanban boards
│   │   ├── projects/           # Project management
│   │   ├── workspaces/         # Workspace management
│   │   ├── teams/              # Team management
│   │   ├── authn/              # Authentication
│   │   └── authz/              # Authorization
│   ├── lib/                    # Shared libraries
│   │   ├── prisma/             # Prisma client & schema
│   │   ├── auth/               # Auth utilities
│   │   └── http/               # HTTP utilities
│   └── contracts/              # Shared types & schemas (Zod)
├── scripts/
│   └── docker/
│       └── base/               # Docker Compose & configs
│           ├── docker-compose.yml
│           ├── cerbos/         # Cerbos policies
│           └── openfga/        # OpenFGA config
├── policies/                   # Authorization policies
├── public/                     # Static assets
└── package.json
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker compose -f scripts/docker/base/docker-compose.yml restart postgres
```

### Prisma Schema Changes

```bash
# Regenerate Prisma client
pnpm prisma:gen

# Push schema changes to database
pnpm prisma:push

# Reset database (⚠️ destructive)
pnpm prisma:reset
```

### Port Conflicts

If services fail to start, check for port conflicts:

| Port      | Service            |
| --------- | ------------------ |
| 3000      | Next.js dev server |
| 5432      | PostgreSQL         |
| 3592      | Cerbos             |
| 8080      | OpenFGA            |
| 9000/9001 | MinIO              |

### Clear Next.js Cache

```bash
pnpm dev:clean
```

---

## Security Notes

- **Secrets** – Never commit `.env.local` or files containing API keys. They are gitignored by default.
- **Database** – The default PostgreSQL credentials (`postgres:postgres`) are for local development only. Use strong credentials in production.
- **MinIO** – Default credentials (`minioadmin:minioadmin`) should be changed in production.
- **Authorization** – Cerbos policies are in `scripts/docker/base/cerbos/policies/`. Review and customize for your needs.

---

## Contributing

1. **Branch naming** – Use descriptive branch names (e.g., `feat/ai-estimation`, `fix/board-drag`)

2. **Commit messages** – Follow [Conventional Commits](https://www.conventionalcommits.org/):

   ```
   <type>(<scope>): <description>
   ```

   Types: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `build`, `chore`

3. **Code style** – Run checks before committing:

   ```bash
   pnpm check
   ```

4. **Pull requests** – Ensure all checks pass and request review from maintainers.

---

## License

**Proprietary** – All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

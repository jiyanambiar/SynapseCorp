# Project Plan: Root Cause Agent

## 1. Project Architecture & Workflow
- Root: Shared context (`plan.md`, `action.md`)
- `/backend`: FastAPI, FalkorDB Python SDK, dynamic data generation. (Branch: `backend-dev`)
- `/frontend`: React dashboard built with Vite, visual graph canvas. (Branch: `frontend-dev`)

## 2. Graph Schema (Track 1 & Track 3)
- **Nodes:** Service, Server, TeamMember, Customer, Incident
- **Edges:** DEPENDS_ON, RUNS_ON, OWNS, IMPACTS, REPORTED

## 3. Core Cypher Queries
- **Downstream Impact (Track 1):** Tracing a failing server through services to affected customers.
- **Personnel Routing (Track 3):** Finding the exact developer who owns a failing service.

## 4. Dynamic Data Generation
- Write `backend/seed.py` to programmatically generate 50+ interconnected synthetic nodes.

## 5. FastAPI Endpoints
- `POST /triage` (Accepts natural language, executes Cypher query, returns triage report)
- `GET /graph/topology` (Returns graph JSON for frontend visualization)

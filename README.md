# Synapse: Graph-Powered Incident Response

<p align="center">
  <strong>An Explainable AI Agent for Incident Response</strong>
  <br />
  Connecting incidents, infrastructure, services, people, and organizational knowledge through FalkorDB.
  <br /><br />
  <a href="https://synapse-frontend-opal.vercel.app/">
    <img src="https://img.shields.io/badge/Live_Demo-Visit_Synapse-6C63FF?style=for-the-badge" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Database-FalkorDB-FF4301?style=for-the-badge" alt="FalkorDB" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React + Vite" />
  <img src="https://img.shields.io/badge/Agent-MCP_Enabled-8A2BE2?style=for-the-badge" alt="MCP Enabled" />
</p>

## Overview

Synapse is a graph-powered incident-response application built using FalkorDB, FastAPI, React, and the Model Context Protocol (MCP).

It uses a connected company knowledge graph to investigate incidents, identify affected customers, recommend responsible personnel, and retrieve relevant organizational knowledge.

Instead of relying on disconnected information, Synapse uses graph traversal to make incident investigations more transparent and actionable.

## Live Demo

- **Deployed Application:** https://synapse-frontend-opal.vercel.app/
- **Demo Video:** https://drive.google.com/file/d/1BcODmpTuNwmUb4bVPPjUn-ppW34YIOKA/view?usp=sharing
- **Public Repository:** https://github.com/jiyanambiar/SynapseCorp.git

## Key Features

- **Intelligent Incident Triage:** Investigates incidents using graph queries.
- **Downstream Impact Analysis:** Identifies services and customers connected to affected infrastructure.
- **Personnel Routing:** Finds team members responsible for affected services and recommends incident owners.
- **Auditable Actions:** Records incident-routing actions as `AgentAction` nodes in FalkorDB.
- **Company Brain:** Connects teams, people, services, servers, customers, projects, documents, decisions, and incidents.
- **Knowledge Search:** Retrieves relevant graph entities, connected facts, and source documents.
- **Service Exploration:** Displays service ownership, dependencies, related incidents, runbooks, and decisions.
- **MCP Integration:** Exposes graph-backed impact tracing, owner lookup, knowledge search, and incident routing as MCP tools.

## Hackathon Tracks

### Track 1: Agents That Act on Connected Data

Synapse uses graph-backed tools to investigate incidents, identify affected customers, recommend responsible owners, and record routing actions.

The triage interface exposes investigation paths, tool usage, and relevant results to help users understand the recommendations.

### Track 3: Company Brain

Synapse connects operational data with organizational knowledge through a unified graph.

Relationships such as `KNOWS`, `WORKED_ON`, `DOCUMENTS`, `ABOUT`, and `SOURCED_FROM` connect people, projects, services, documents, and decisions.

This allows investigations to use connected company knowledge rather than isolated records.

## Technology Stack

| Technology | Purpose |
|---|---|
| FalkorDB | Graph database and persistent graph records |
| Python | Backend implementation |
| FastAPI | REST API and incident-response workflows |
| Cypher | Graph queries and relationship traversal |
| React | Frontend interface |
| Vite | Frontend development and build tooling |
| Model Context Protocol (MCP) | Exposes graph tools to compatible AI clients |
| Docker | Local database setup |
| Vercel | Frontend deployment |

## Graph Data Model

Synapse represents company information as nodes connected through relationships.

### Main Entities

- `Workspace`
- `Team`
- `TeamMember`
- `Service`
- `Server`
- `Customer`
- `Incident`
- `Project`
- `Document`
- `Decision`
- `AgentAction`
- `Investigation`

### Important Relationships

| Relationship | Purpose |
|---|---|
| `REPORTED_ON` | Connects an incident to a server |
| `RUNS_ON` | Connects a service to a server |
| `IMPACTS` | Connects a service to a customer |
| `OWNS` | Connects a team member to a service |
| `DEPENDS_ON` | Represents service dependencies |
| `HAS_MEMBER` | Connects a team to its members |
| `KNOWS` | Connects a team member to a service they know |
| `WORKED_ON` | Connects a team member to a project |
| `DOCUMENTS` | Connects a document to a service |
| `ABOUT` | Connects a decision to a service |
| `SOURCED_FROM` | Links a decision to its source document |
| `ACTED_ON` | Links an agent action to an incident |
| `ROUTED_TO` | Links an agent action to its assigned owner |

## Actual Cypher Queries

The following queries are taken from the application's backend implementation.

### 1. Downstream Impact Analysis

**Purpose:** Finds services and customers connected to an incident through its reported server.

```cypher
MATCH (i:Incident {id: $inc_id})-[:REPORTED_ON]->(:Server)<-[:RUNS_ON]-(service:Service)-[:IMPACTS]->(customer:Customer)
RETURN service.name, customer.name
```

The query returns the service and customer names associated with the incident's graph path.

### 2. Responsible Owner Lookup

**Purpose:** Identifies team members who own services connected to the incident.

```cypher
MATCH (i:Incident {id: $inc_id})-[:REPORTED_ON]->(:Server)<-[:RUNS_ON]-(service:Service)<-[:OWNS]-(owner:TeamMember)
RETURN service.name, owner.name
```

The returned owners provide evidence for the incident-routing recommendation.

### 3. Recording an Incident Routing Action

**Purpose:** Creates an `AgentAction` node and links it to the incident and the selected owner.

```cypher
MATCH (incident:Incident {id: $incident_id}), (owner:TeamMember {name: $owner})
CREATE (action:AgentAction) SET action = $properties
CREATE (action)-[:ACTED_ON]->(incident)
CREATE (action)-[:ROUTED_TO]->(owner)
```

Before executing this query, the backend updates the incident's `assignee` property.

The action node stores details such as the action type, assigned owner, timestamp, and reasoning.

These queries use parameterized values supplied by the backend.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Checks backend and graph connectivity |
| `GET` | `/dashboard` | Retrieves dashboard data and metrics |
| `GET` | `/incidents` | Lists incidents |
| `GET` | `/incidents/{incident_id}` | Retrieves an incident |
| `POST` | `/incidents` | Creates an incident |
| `PATCH` | `/incidents/{incident_id}` | Updates incident properties |
| `POST` | `/triage` | Runs graph-based incident triage |
| `POST` | `/agent/triage` | Returns triage results and an owner recommendation |
| `POST` | `/incidents/{incident_id}/route` | Routes an incident to a graph-recommended owner |
| `GET` | `/services` | Lists services |
| `GET` | `/services/{service_id}` | Retrieves service details and relationships |
| `POST` | `/knowledge/search` | Searches connected company knowledge |
| `GET` | `/graph/topology` | Returns graph nodes and relationships |

The backend also provides endpoints for teams, workspace information, reports, and investigations.

## MCP Integration

The MCP server is implemented in `backend/mcp_server.py`.

It exposes four tools:

- `trace_downstream_impact`
- `find_responsible_owner`
- `search_company_knowledge`
- `route_incident_to_graph_owner`

These tools allow compatible MCP clients to query graph relationships, investigate incidents, retrieve company knowledge, and execute supported routing actions.

## Getting Started

### Prerequisites

- Python
- Node.js and npm
- Docker

### 1. Start FalkorDB

From your terminal, run:

```bash
docker run -p 6379:6379 falkordb/falkordb:latest
```

Keep the database running.

### 2. Set Up the Backend

From the repository root, create and activate a virtual environment.

**macOS / Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies and initialize the graph:

```bash
pip install -r requirements.txt
python backend/seed.py --reset
```

**Important:** The `--reset` option deletes existing graph data before seeding the demonstration dataset.

Start the backend:

```bash
python -m uvicorn backend.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

API documentation is available at `http://localhost:8000/docs`.

### 3. Set Up the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite. By default, it is `http://localhost:5173`.

Ensure the frontend is configured to communicate with the correct backend URL.

### 4. Run the MCP Server (Optional)

From the repository root, with the virtual environment activated, run:

```bash
python -m backend.mcp_server
```

Configure your MCP-compatible client to launch this command from the repository root.

## Verification

Run the backend verification script from the repository root:

```bash
python backend/verify.py
```

Verify that the frontend builds successfully:

```bash
cd frontend
npm run build
```

## AI Usage Disclosure

AI coding assistants were used as development aids. Their use is disclosed in accordance with the hackathon rules.

The submitted implementation should be reviewed, tested, and understood by the participants, who should be able to explain the graph model, Cypher queries, application architecture, MCP tools, and technical decisions.

---

<p align="center">
  <strong>Synapse</strong>
  <br />
  Connecting incidents, infrastructure, people, and knowledge.
  <br /><br />
  <a href="https://synapse-frontend-opal.vercel.app/">Visit the Live Demo</a>
</p>
# Synapse: Graph-Powered Incident Response

![FalkorDB](https://img.shields.io/badge/Database-FalkorDB-FF4301?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React%2FVite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MCP](https://img.shields.io/badge/Agent-MCP_Enabled-8A2BE2?style=for-the-badge)

Synapse is an inspectable incident-response agent built natively on **FalkorDB**. By leveraging a "Company Brain" graph, it transforms chaotic incident data into two explainable, actionable graph traversals:

* **Downstream Impact:** `Incident → Server ← Service → Customer`
* **Personnel Routing:** `Incident → Server ← Service ← TeamMember`

The agent takes auditable actions, such as assigning an incident to the graph-recommended owner. FalkorDB acts as the immutable system of record for services, people, teams, incidents, documents, decisions, projects, agent actions, and all structural relationships.

## Hackathon Tracks Covered

### Track 1: Agents That Act on Connected Data
* **Intelligent Triage:** `POST /agent/triage` seamlessly selects and executes multi-hop graph tools to analyze incidents.
* **MCP Integration:** `backend/mcp_server.py` exposes impact tracing, owner lookup, company knowledge search, and incident routing as fully discoverable MCP (Model Context Protocol) tools. 
* **Transparent Evidence:** The triage UI actively reports selected graph tools, relationship paths, result counts, at-risk customers, and responsible owners.
* **Auditable Actions:** `POST /incidents/{id}/route` utilizes personnel traversal to assign incident owners, persisting an `AgentAction` node with its logical reasoning and linked entities. Acknowledgement and routing are immutable FalkorDB actions, not ephemeral frontend state.

### Track 3: Company Brain
* **Holistic Topology:** The graph interlinks teams, members, services, servers, customers, projects, documents, decisions, incidents, and agent actions.
* **Graph-Grounded Investigations:** Search across all graph entities and retrieve connected facts and source documents instantly via `POST /knowledge/search` and the `search_company_knowledge` MCP tool.
* **Deep Service Insights:** Dedicated service pages display owners, upstream/downstream dependencies, runbooks, and decisions, complete with their native graph source IDs.
* **Traceable Knowledge:** The seeded graph embeds explicit `KNOWS`, `WORKED_ON`, `DOCUMENTS`, `ABOUT`, and `SOURCED_FROM` relationships. This allows complete inspectability into who possesses specific domain knowledge and traces operational decisions directly to their source.

## Getting Started

Follow these steps to spin up the complete full-stack environment and the MCP-compatible agent.

### 1. Database Setup
Start a local instance of FalkorDB using Docker:
```bash
docker run -p 6379:6379 falkordb/falkordb:latest
```

### 2. Backend Initialization
Install the required Python dependencies in your virtual environment and seed the database with the complete synthetic demo graph. *(Note: `--reset` will replace any existing graph data).*

```bash
pip install -r requirements.txt
./venv/bin/python backend/seed.py --reset
```

Run the FastAPI backend server:
```bash
./venv/bin/uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend Initialization
In a new terminal window, install the Node dependencies and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
Access the application at: `http://localhost:5173`

### 4. Optional: Launch the MCP Server
To connect an MCP-compatible agent to the graph tools, open a new terminal at the repository root and start the server using the standard input/output transport:
```bash
./venv/bin/python -m backend.mcp_server
```
*Configure your preferred MCP client to launch this command using the repository root as the working directory.*

## Automated Verification

To ensure all graph-backed data, Track 1 triage evidence, and Track 3 source-linked knowledge are correctly established (without mutating incident states), run the automated verification suite:

```bash
# Verify backend graph logic
./venv/bin/python backend/verify.py

# Verify frontend build integrity
cd frontend && npm run build
```
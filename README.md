# Synapse — graph-powered incident response

Synapse is an inspectable incident-response agent built on FalkorDB. It turns an incident into two explainable graph traversals:

- **Downstream impact:** `Incident → Server ← Service → Customer`
- **Personnel routing:** `Incident → Server ← Service ← TeamMember`

The agent can then take an auditable action—assign the incident to the graph-recommended owner. FalkorDB is the system of record for services, people, teams, incidents, documents, decisions, projects, agent actions, and all relationships.

## Tracks covered

### Track 1 — Agents That Act on Connected Data

- `POST /agent/triage` selects and runs two multi-hop graph tools.
- `backend/mcp_server.py` exposes impact tracing, owner lookup, company knowledge search, and incident routing as discoverable MCP tools. The triage UI reports the selected graph tools and evidence paths.
- The UI shows each tool, relationship path, result count, customers at risk, and responsible owners.
- `POST /incidents/{id}/route` uses the personnel traversal to assign the incident owner and persists an `AgentAction` node with its reason and links.
- Acknowledgement and routing are persistent FalkorDB actions, not frontend state.

### Track 3 — Company Brain

- The graph connects teams, team members, services, servers, customers, projects, documents, decisions, incidents, and agent actions.
- Investigations search people, teams, services, projects, incidents, documents, and decisions across the graph, then show connected facts and source documents.
- `POST /knowledge/search` and the MCP `search_company_knowledge` tool return graph matches, relationship facts, and source references.
- Service detail pages show owner, dependencies, documents/runbooks, decisions, and their graph source IDs.
- The seeded graph includes explicit `KNOWS`, `WORKED_ON`, `DOCUMENTS`, `ABOUT`, and `SOURCED_FROM` relationships so judges can inspect who knows what and trace decisions to a source.

## Run locally

1. Install backend requirements in your virtual environment: `pip install -r requirements.txt`.
2. Start FalkorDB (for example `docker run -p 6379:6379 falkordb/falkordb:latest`).
3. Seed the complete demo graph. This deliberately replaces the selected graph:

   ```bash
   ./venv/bin/python backend/seed.py --reset
   ```

4. Run the API:

   ```bash
   ./venv/bin/uvicorn backend.main:app --reload --port 8000
   ```

5. In another terminal, run the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

Open `http://localhost:5173`.

To connect an MCP-compatible agent to the graph tools, start the server from the repository root in another terminal:

```bash
./venv/bin/python -m backend.mcp_server
```

The server uses MCP stdio transport. Configure your MCP client to launch that command with the repository root as its working directory.

## Judge demo script

1. Open **Services**, choose **Checkout API**, and show its owner, dependencies, runbook, and source-linked decision.
2. Open **Incidents** → **Checkout API latency spike**.
3. Click **Run graph agent triage**. Explain the two tool runs and the displayed relationship paths.
4. Show the affected customers and the graph-recommended owner.
5. Click **Assign [owner]**. The incident assignee is updated in FalkorDB and an `AgentAction` node is added to the topology.
6. Click **Acknowledge incident** to record the response state and timestamp. Explain that acknowledgement accepts responsibility; it does not resolve the event.
7. Open **Topology** to show the connected evidence. In **Investigations**, ask who owns Checkout API and which runbook covers it; show the connected facts, source document, and saved query.

## Automated verification

After seeding, run:

```bash
./venv/bin/python backend/verify.py
cd frontend && npm run build
```

`verify.py` checks the required graph-backed data, Track 1 triage evidence, and Track 3 source-linked knowledge without changing incident state.

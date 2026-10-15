# Synapse — graph-powered incident response

Synapse is an inspectable incident-response agent built on FalkorDB. It turns an incident into two explainable graph traversals:

- **Downstream impact:** `Incident → Server ← Service → Customer`
- **Personnel routing:** `Incident → Server ← Service ← TeamMember`

The agent can then take an auditable action—assign the incident to the graph-recommended owner. FalkorDB is the system of record for services, people, teams, incidents, documents, decisions, projects, agent actions, and all relationships.

## Tracks covered

### Track 1 — Agents That Act on Connected Data

- `POST /agent/triage` selects and runs two multi-hop graph tools.
- The UI shows each tool, relationship path, result count, customers at risk, and responsible owners.
- `POST /incidents/{id}/route` uses the personnel traversal to assign the incident owner and persists an `AgentAction` node with its reason and links.
- Acknowledgement and routing are persistent FalkorDB actions, not frontend state.

### Track 3 — Company Brain

- The graph connects teams, team members, services, servers, customers, projects, documents, decisions, incidents, and agent actions.
- Service detail pages show owner, dependencies, documents/runbooks, decisions, and their graph source IDs.
- The seeded graph includes explicit `KNOWS`, `WORKED_ON`, `DOCUMENTS`, `ABOUT`, and `SOURCED_FROM` relationships so judges can inspect who knows what and trace decisions to a source.

## Run locally

1. Start FalkorDB (for example `docker run -p 6379:6379 falkordb/falkordb:latest`).
2. Seed the complete demo graph. This deliberately replaces the selected graph:

   ```bash
   ./venv/bin/python backend/seed.py --reset
   ```

3. Run the API:

   ```bash
   ./venv/bin/uvicorn backend.main:app --reload --port 8000
   ```

4. In another terminal, run the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

Open `http://localhost:5173`.

## Judge demo script

1. Open **Services**, choose **Checkout API**, and show its owner, dependencies, runbook, and source-linked decision.
2. Open **Incidents** → **Checkout API latency spike**.
3. Click **Run graph agent triage**. Explain the two tool runs and the displayed relationship paths.
4. Show the affected customers and the graph-recommended owner.
5. Click **Assign [owner]**. The incident assignee is updated in FalkorDB and an `AgentAction` node is added to the topology.
6. Click **Acknowledge incident** to record the response state and timestamp. Explain that acknowledgement accepts responsibility; it does not resolve the event.
7. Open **Topology** to show the connected evidence and **Investigations** to show persistent investigation history.

## Automated verification

After seeding, run:

```bash
./venv/bin/python backend/verify.py
cd frontend && npm run build
```

`verify.py` checks the required graph-backed data, Track 1 triage evidence, and Track 3 source-linked knowledge without changing incident state.

"""HTTP API for the FalkorDB-backed Synapse workspace.

The API deliberately keeps the graph as the source of truth. Presentation
fields are normalised here so the web client never ships fixture data.
"""
from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from falkordb import FalkorDB


app = FastAPI(title="Synapse API")

# Vite uses 5173 in development and 4173 for `vite preview`. Deployments can
# opt in additional origins without changing source code.
allowed_origins = [origin.strip() for origin in os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"
).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

db = FalkorDB(host=os.getenv("FALKORDB_HOST", "localhost"), port=int(os.getenv("FALKORDB_PORT", "6379")))
GRAPH_NAME = os.getenv("FALKORDB_GRAPH", "companybrain")


class TriageRequest(BaseModel):
    incident_id: str


class IncidentInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    service_id: str | None = None
    severity: str | None = None
    status: str | None = None
    impact: int | None = Field(default=None, ge=0)
    region: str | None = None


class IncidentUpdate(BaseModel):
    status: str | None = None
    assignee: str | None = None
    acknowledged_at: str | None = None


class TeamInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class WorkspaceInput(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=200)


class InvestigationInput(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    incident_id: str | None = None


def graph():
    return db.select_graph(GRAPH_NAME)


def rows(query: str, params: dict[str, Any] | None = None) -> list[list[Any]]:
    return graph().query(query, params or {}).result_set


def props(value: Any) -> dict[str, Any]:
    return dict(value or {})


def slug(value: str) -> str:
    result = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return result or uuid4().hex[:8]


def first_string(values: Any) -> str | None:
    if isinstance(values, list):
        return next((str(value) for value in values if value), None)
    return str(values) if values else None


def graph_health(server_statuses: Any) -> str | None:
    """Derive service health from the real server state when no metric exists."""
    states = {str(status).lower() for status in (server_statuses or []) if status}
    if states & {"failing", "failed", "down", "degraded"}:
        return "Degraded"
    if states and states <= {"healthy", "operational", "up"}:
        return "Healthy"
    return None


def service_record(raw: dict[str, Any], owners: Any = None, dependencies: int = 0, server_statuses: Any = None) -> dict[str, Any]:
    name = raw.get("name") or raw.get("id") or "Unnamed service"
    return {
        "id": raw.get("id") or slug(str(name)), "name": name,
        "status": raw.get("status") or graph_health(server_statuses) or "Unknown", "latency": raw.get("latency"),
        "uptime": raw.get("uptime"), "region": raw.get("region"),
        "description": raw.get("description"), "team": raw.get("team") or first_string(owners),
        "dependencies": int(dependencies or 0),
    }


def incident_record(raw: dict[str, Any], service: dict[str, Any] | None = None, owners: Any = None,
                    server_statuses: Any = None, impacted_customers: int = 0) -> dict[str, Any]:
    incident_id = raw.get("id") or slug(str(raw.get("title") or raw.get("description") or uuid4().hex))
    title = raw.get("title") or raw.get("description") or incident_id
    health = graph_health(server_statuses)
    normal_service = service_record(service or {}, owners, server_statuses=server_statuses) if service else None
    severity = raw.get("severity") or ("SEV 1" if health == "Degraded" else "SEV 3" if health == "Healthy" else "Unknown")
    status = raw.get("status") or ("Investigating" if health == "Degraded" else "Monitoring" if health == "Healthy" else "Unknown")
    return {
        "id": incident_id, "title": title,
        "description": raw.get("description") or raw.get("title"),
        "severity": severity, "status": status,
        "impact": raw.get("impact") if raw.get("impact") is not None else impacted_customers,
        "region": raw.get("region") or (normal_service or {}).get("region"),
        "created_at": raw.get("created_at"), "acknowledged_at": raw.get("acknowledged_at"),
        "service": normal_service.get("name") if normal_service else None,
        "service_id": normal_service.get("id") if normal_service else None,
        "assignee": raw.get("assignee") or first_string(owners),
    }


def all_services() -> list[dict[str, Any]]:
    result = rows("""
        MATCH (s:Service)
        OPTIONAL MATCH (owner:TeamMember)-[:OWNS]->(s)
        OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dependency:Service)
        OPTIONAL MATCH (s)-[:RUNS_ON]->(server:Server)
        RETURN properties(s), collect(DISTINCT owner.name), count(DISTINCT dependency), collect(DISTINCT server.status)
    """)
    return sorted((service_record(props(row[0]), row[1], row[2], row[3]) for row in result), key=lambda service: str(service["name"]).lower())


def find_service(service_id: str) -> dict[str, Any]:
    found = next((service for service in all_services() if service["id"] == service_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Service not found")
    return found


def all_incidents() -> list[dict[str, Any]]:
    result = rows("""
        MATCH (i:Incident)
        OPTIONAL MATCH (i)-[:REPORTED_ON]->(server:Server)<-[:RUNS_ON]-(service:Service)
        OPTIONAL MATCH (owner:TeamMember)-[:OWNS]->(service)
        OPTIONAL MATCH (service)-[:IMPACTS]->(customer:Customer)
        RETURN properties(i), properties(service), collect(DISTINCT owner.name), collect(DISTINCT server.status), count(DISTINCT customer)
    """)
    return sorted((incident_record(props(row[0]), props(row[1]), row[2], row[3], row[4]) for row in result), key=lambda incident: str(incident["created_at"] or ""), reverse=True)


def find_incident(incident_id: str) -> dict[str, Any]:
    found = next((incident for incident in all_incidents() if incident["id"] == incident_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Incident not found")
    return found


@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")


@app.get("/health")
def health_check():
    rows("RETURN 1")
    return {"status": "ok", "graph": GRAPH_NAME, "cors_origins": allowed_origins}


@app.get("/dashboard")
def get_dashboard():
    services = all_services()
    incidents = all_incidents()
    active = [incident for incident in incidents if incident["status"].lower() not in {"resolved", "closed"}]
    healthy = [service for service in services if service["status"].lower() in {"healthy", "operational"}]
    return {
        "services": services, "incidents": active, "topology": topology_data(),
        "metrics": {"active_incidents": len(active), "services_total": len(services),
                    "services_healthy": len(healthy),
                    "customers_impacted": sum(int(incident["impact"] or 0) for incident in active)},
    }


@app.get("/incidents")
def get_incidents():
    return all_incidents()


@app.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    return find_incident(incident_id)


@app.post("/incidents", status_code=201)
def create_incident(payload: IncidentInput):
    incident_id = f"inc-{uuid4().hex[:10]}"
    record = payload.model_dump(exclude_none=True)
    record.update({"id": incident_id, "created_at": datetime.now(timezone.utc).isoformat()})
    rows("CREATE (i:Incident) SET i = $properties", {"properties": record})
    if payload.service_id:
        service = find_service(payload.service_id)
        rows("""
            MATCH (i:Incident {id: $incident_id}), (s:Service)
            WHERE s.id = $service_id OR s.name = $service_name
            MATCH (s)-[:RUNS_ON]->(server:Server)
            WITH i, server LIMIT 1
            CREATE (i)-[:REPORTED_ON]->(server)
        """, {"incident_id": incident_id, "service_id": service["id"], "service_name": service["name"]})
    return find_incident(incident_id)


@app.patch("/incidents/{incident_id}")
def update_incident(incident_id: str, payload: IncidentUpdate):
    find_incident(incident_id)
    updates = payload.model_dump(exclude_none=True)
    if updates:
        rows("MATCH (i:Incident {id: $incident_id}) SET i += $updates", {"incident_id": incident_id, "updates": updates})
    return find_incident(incident_id)


@app.post("/triage")
def run_triage(request: TriageRequest):
    incident = find_incident(request.incident_id)
    impact_raw = rows("""
        MATCH (i:Incident {id: $inc_id})-[:REPORTED_ON]->(:Server)<-[:RUNS_ON]-(service:Service)-[:IMPACTS]->(customer:Customer)
        RETURN service.name, customer.name
    """, {"inc_id": request.incident_id})
    owner_raw = rows("""
        MATCH (i:Incident {id: $inc_id})-[:REPORTED_ON]->(:Server)<-[:RUNS_ON]-(service:Service)<-[:OWNS]-(owner:TeamMember)
        RETURN service.name, owner.name
    """, {"inc_id": request.incident_id})
    downstream_impact = [{"service": row[0], "customer": row[1]} for row in impact_raw]
    personnel_routing = [{"service": row[0], "owner": row[1]} for row in owner_raw]
    return {"incident": incident, "downstream_impact": downstream_impact, "personnel_routing": personnel_routing,
            "summary": {"affected_customers": len({item["customer"] for item in downstream_impact}),
                        "responsible_owners": len({item["owner"] for item in personnel_routing})},
            "tool_runs": [
                {"tool": "trace_downstream_impact", "purpose": "Find customers affected by the incident service.",
                 "path": "Incident → Server ← Service → Customer", "result_count": len(downstream_impact)},
                {"tool": "find_responsible_owner", "purpose": "Find the person accountable for the affected service.",
                 "path": "Incident → Server ← Service ← TeamMember", "result_count": len(personnel_routing)},
            ]}


@app.post("/agent/triage")
def agent_triage(request: TriageRequest):
    """A small, inspectable agent loop: choose graph tools, explain, then recommend an action."""
    triage = run_triage(request)
    recommended_owner = triage["personnel_routing"][0]["owner"] if triage["personnel_routing"] else None
    return {**triage,
            "recommendation": {"action": "route_to_owner" if recommended_owner else "request_owner_assignment",
                               "owner": recommended_owner,
                               "reason": "The graph ownership traversal identified the responder linked to the impacted service." if recommended_owner else "No TeamMember owns the affected service in the graph."}}


@app.post("/incidents/{incident_id}/route")
def route_incident_to_graph_owner(incident_id: str):
    """Take a reversible, auditable action chosen from the personnel graph path."""
    find_incident(incident_id)
    triage = run_triage(TriageRequest(incident_id=incident_id))
    if not triage["personnel_routing"]:
        raise HTTPException(status_code=409, detail="No graph owner is available to route this incident")
    owner = triage["personnel_routing"][0]["owner"]
    action_id = f"action-{uuid4().hex[:10]}"
    action = {"id": action_id, "type": "route_incident", "owner": owner, "created_at": datetime.now(timezone.utc).isoformat(),
              "reason": "Assigned from the Incident → Server ← Service ← TeamMember graph path."}
    rows("MATCH (incident:Incident {id: $incident_id}) SET incident.assignee = $owner", {"incident_id": incident_id, "owner": owner})
    rows("""
        MATCH (incident:Incident {id: $incident_id}), (owner:TeamMember {name: $owner})
        CREATE (action:AgentAction) SET action = $properties
        CREATE (action)-[:ACTED_ON]->(incident)
        CREATE (action)-[:ROUTED_TO]->(owner)
    """, {"incident_id": incident_id, "owner": owner, "properties": action})
    return {"incident": find_incident(incident_id), "action": action, "evidence": triage["personnel_routing"]}


@app.get("/services")
def get_services():
    return all_services()


@app.get("/services/{service_id}")
def get_service(service_id: str):
    service = find_service(service_id)
    raw = rows("""
        MATCH (s:Service)
        WHERE s.id = $service_id OR s.name = $service_name
        OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dependency:Service)
        OPTIONAL MATCH (dependent:Service)-[:DEPENDS_ON]->(s)
        OPTIONAL MATCH (s)-[:RUNS_ON]->(:Server)<-[:REPORTED_ON]-(incident:Incident)
        OPTIONAL MATCH (document:Document)-[:DOCUMENTS]->(s)
        OPTIONAL MATCH (decision:Decision)-[:ABOUT]->(s)
        RETURN collect(DISTINCT properties(dependency)), collect(DISTINCT properties(dependent)), collect(DISTINCT properties(incident)),
               collect(DISTINCT properties(document)), collect(DISTINCT properties(decision))
    """, {"service_id": service["id"], "service_name": service["name"]})
    detail = raw[0] if raw else [[], [], []]
    services = {candidate["id"]: candidate for candidate in all_services()}
    def ids(items):
        return [slug(str(props(item).get("name") or props(item).get("id"))) for item in items if item]
    incident_ids = [props(item).get("id") for item in detail[2] if item]
    return {**service, "dependencies_list": [services[item] for item in ids(detail[0]) if item in services],
            "dependents": [services[item] for item in ids(detail[1]) if item in services],
            "incidents": [find_incident(item) for item in incident_ids if item],
            "documents": [props(item) for item in detail[3] if item], "decisions": [props(item) for item in detail[4] if item]}


def topology_data() -> dict[str, list[dict[str, Any]]]:
    node_rows = rows("MATCH (n) RETURN id(n), labels(n), properties(n)")
    edge_rows = rows("MATCH (n)-[r]->(m) RETURN id(n), id(m), type(r)")
    return {"nodes": [{"id": str(row[0]), "labels": row[1], "props": props(row[2])} for row in node_rows],
            "edges": [{"source": str(row[0]), "target": str(row[1]), "type": row[2]} for row in edge_rows]}


@app.get("/graph/topology")
def get_topology():
    return topology_data()


@app.get("/teams")
def get_teams():
    team_rows = rows("""
        MATCH (team:Team)
        OPTIONAL MATCH (team)-[:HAS_MEMBER]->(member:TeamMember)
        OPTIONAL MATCH (member)-[:OWNS]->(service:Service)
        OPTIONAL MATCH (incident:Incident)-[:REPORTED_ON]->(:Server)<-[:RUNS_ON]-(service)
        RETURN properties(team), collect(DISTINCT member.name), collect(DISTINCT properties(service)), count(DISTINCT incident)
    """)
    teams = [{"id": props(row[0]).get("id") or slug(props(row[0]).get("name", "team")),
             "name": props(row[0]).get("name"), "members": [member for member in row[1] if member],
             "services": [service_record(props(item)) for item in row[2] if item],
             "on_call": props(row[0]).get("on_call") or first_string(row[1]), "open_incidents": int(row[3] or 0)} for row in team_rows]
    if not teams:
        member_rows = rows("""
            MATCH (member:TeamMember)
            OPTIONAL MATCH (member)-[:OWNS]->(service:Service)
            OPTIONAL MATCH (incident:Incident)-[:REPORTED_ON]->(:Server)<-[:RUNS_ON]-(service)
            RETURN properties(member), collect(DISTINCT properties(service)), count(DISTINCT incident)
        """)
        teams = [{"id": record.get("id") or slug(record.get("name", "owner")), "name": record.get("team") or record.get("name"),
                  "members": [record.get("name")] if record.get("name") else [],
                  "services": [service_record(props(item)) for item in row[1] if item],
                  "on_call": record.get("on_call") or record.get("name"), "open_incidents": int(row[2] or 0)}
                 for row in member_rows for record in [props(row[0])]]
    return sorted(teams, key=lambda team: str(team["name"] or "").lower())


@app.post("/teams", status_code=201)
def create_team(payload: TeamInput):
    team_id = f"team-{uuid4().hex[:10]}"
    rows("CREATE (team:Team) SET team = $properties", {"properties": {"id": team_id, "name": payload.name}})
    return {"id": team_id, "name": payload.name, "members": [], "services": [], "on_call": None, "open_incidents": 0}


@app.get("/workspace")
def get_workspace():
    result = rows("MATCH (workspace:Workspace) RETURN properties(workspace) LIMIT 1")
    if result:
        return props(result[0][0])
    # A workspace is a graph record, not frontend fixture data. Initialise it
    # once for graph installations created with the older minimal seed.
    workspace = {"id": "default", "name": f"{GRAPH_NAME.replace('_', ' ').title()} workspace"}
    rows("CREATE (workspace:Workspace) SET workspace = $properties", {"properties": workspace})
    return workspace


@app.patch("/workspace")
def update_workspace(payload: WorkspaceInput):
    updates = payload.model_dump(exclude_none=True)
    if updates:
        rows("MERGE (workspace:Workspace {id: 'default'}) SET workspace += $updates", {"updates": updates})
    return get_workspace()


@app.get("/reports")
def get_reports():
    incidents, services = all_incidents(), all_services()
    severity: dict[str, int] = {}
    for incident in incidents:
        severity[incident["severity"]] = severity.get(incident["severity"], 0) + 1
    uptime_values = [float(str(service["uptime"]).replace("%", "")) for service in services if service["uptime"] is not None]
    return {"incidents_total": len(incidents), "services_total": len(services),
            "average_uptime": sum(uptime_values) / len(uptime_values) if uptime_values else None,
            "by_severity": [{"severity": key, "count": value} for key, value in severity.items()], "incidents": incidents}


@app.get("/investigations")
def get_investigations():
    result = rows("MATCH (i:Investigation) RETURN properties(i)")
    return sorted((props(row[0]) for row in result), key=lambda item: str(item.get("created_at") or ""), reverse=True)[:20]


@app.post("/investigations", status_code=201)
def create_investigation(payload: InvestigationInput):
    record = {"id": f"investigation-{uuid4().hex[:10]}", "query": payload.query,
              "incident_id": payload.incident_id, "created_at": datetime.now(timezone.utc).isoformat(), "status": "Complete"}
    evidence = []
    if payload.incident_id:
        triage = run_triage(TriageRequest(incident_id=payload.incident_id))
        evidence = [*triage["downstream_impact"], *triage["personnel_routing"]]
    rows("CREATE (i:Investigation) SET i = $properties", {"properties": record})
    return {**record, "evidence": evidence}

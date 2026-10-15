"""Read-only acceptance checks for the Track 1 and Track 3 demo."""
from fastapi.testclient import TestClient

try:
    from backend.main import app
except ModuleNotFoundError:  # Supports `python backend/verify.py` from the repo root.
    from main import app


def check(condition: bool, message: str):
    if not condition:
        raise AssertionError(message)
    print(f"✓ {message}")


client = TestClient(app)

services_response = client.get("/services")
check(services_response.status_code == 200, "services endpoint is available")
services = services_response.json()
check(len(services) >= 10, "seeded graph contains the complete service dataset")

service = services[0]
detail_response = client.get(f"/services/{service['id']}")
check(detail_response.status_code == 200, "service detail is available")
detail = detail_response.json()
check(bool(detail["documents"]), "Track 3: service has graph-linked documentation")
check(bool(detail["decisions"]), "Track 3: service has source-traceable decisions")

incidents_response = client.get("/incidents")
check(incidents_response.status_code == 200, "incidents endpoint is available")
incidents = incidents_response.json()
check(bool(incidents), "seeded graph contains incidents")

triage_response = client.post("/agent/triage", json={"incident_id": incidents[0]["id"]})
check(triage_response.status_code == 200, "Track 1: graph agent triage is available")
triage = triage_response.json()
check(len(triage["tool_runs"]) == 2, "Track 1: agent selected impact and owner graph tools")
check(bool(triage["downstream_impact"]), "Track 1: multi-hop customer impact traversal returned evidence")
check(bool(triage["personnel_routing"]), "Track 1: multi-hop owner routing traversal returned evidence")

print("\nAll Track 1 and Track 3 read-only acceptance checks passed.")

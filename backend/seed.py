from __future__ import annotations
import argparse
import random
from datetime import datetime, timedelta, timezone
from falkordb import FalkorDB

SERVICE_TEMPLATES = [
    ("checkout-api", "Checkout API", "Commerce", "Degraded", "2.84s", "99.82%", "Checkout and payment orchestration."),
    ("payments", "Payments", "Payments", "Healthy", "42ms", "99.99%", "Payment authorization and settlement."),
    ("order-service", "Order Service", "Commerce", "Healthy", "67ms", "99.97%", "Order lifecycle and fulfilment coordination."),
    ("customer-db", "Customer DB", "Data", "Healthy", "18ms", "99.99%", "Primary customer profile store."),
    ("redis-cache", "Redis Cache", "Infrastructure", "Healthy", "8ms", "99.98%", "Shared low-latency cache cluster."),
    ("worker-queue", "Worker Queue", "Infrastructure", "Degraded", "10.4k jobs", "99.43%", "Background task queue with elevated backlog."),
    ("webhook-service", "Webhook Service", "Integrations", "Degraded", "34s", "98.91%", "Outbound event delivery service."),
    ("auth-api", "Auth API", "Identity", "Healthy", "24ms", "99.99%", "Authentication and session management."),
    ("search-index", "Search Index", "Data", "Healthy", "81ms", "99.96%", "Product and customer search index."),
    ("notification-service", "Notification Service", "Integrations", "Healthy", "114ms", "99.95%", "Email and notification delivery."),
]

TEAM_MEMBERS = {
    "Commerce": ["Sarah Chen", "Jordan Miller", "Priya Rao"],
    "Payments": ["Alex Lee", "Morgan Kim", "Drew Park"],
    "Data": ["Taylor Reed", "Nina Shah", "Owen Brooks"],
    "Infrastructure": ["Casey Nguyen", "Riley James", "Avery Stone"],
    "Integrations": ["Sam Patel", "Jamie Flores", "Robin Grant"],
    "Identity": ["Noah Wright", "Maya Singh", "Elliot Ward"],
}

def add_node(graph, label: str, properties: dict):
    graph.query(f"CREATE (node:{label}) SET node = $properties", {"properties": properties})

def add_edge(graph, from_label: str, from_id: str, edge: str, to_label: str, to_id: str):
    graph.query(
        f"MATCH (source:{from_label} {{id: $from_id}}), (target:{to_label} {{id: $to_id}}) CREATE (source)-[:{edge}]->(target)",
        {"from_id": from_id, "to_id": to_id},
    )

def generate_synthetic_graph(graph_name: str = "companybrain"):
    graph = FalkorDB(host="localhost", port=6379).select_graph(graph_name)
    graph.query("MATCH (node) DETACH DELETE node")
    random.seed(7)
    now = datetime.now(timezone.utc)

    add_node(graph, "Workspace", {"id": "default", "name": "Synapse reliability workspace", "email": "oncall@synapse.example", "description": "Main workspace for Synapse reliability operations."})
    
    member_ids = {}
    for team_name, members in TEAM_MEMBERS.items():
        team_id = team_name.lower()
        on_call = random.choice(members)
        add_node(graph, "Team", {"id": team_id, "name": team_name, "on_call": on_call, "description": f"The {team_name} engineering team."})
        for member_name in members:
            member_id = member_name.lower().replace(" ", "-")
            member_ids[member_name] = member_id
            add_node(graph, "TeamMember", {"id": member_id, "name": member_name, "team": team_name, "description": f"Engineer on the {team_name} team."})
            add_edge(graph, "Team", team_id, "HAS_MEMBER", "TeamMember", member_id)

    service_by_id = {}
    server_by_service = {}
    for index, (service_id, name, team_name, status, latency, uptime, description) in enumerate(SERVICE_TEMPLATES):
        region = random.choice(["us-east-1", "us-east-1a", "eu-west-1"])
        service = {"id": service_id, "name": name, "team": team_name, "status": status, "latency": latency, "uptime": uptime, "region": region, "description": description}
        service_by_id[service_id] = service
        add_node(graph, "Service", service)
        
        member_name = TEAM_MEMBERS[team_name][index % len(TEAM_MEMBERS[team_name])]
        add_edge(graph, "TeamMember", member_ids[member_name], "OWNS", "Service", service_id)
        add_edge(graph, "TeamMember", member_ids[member_name], "KNOWS", "Service", service_id)
        
        project_id = f"{service_id}-project"
        add_node(graph, "Project", {"id": project_id, "name": f"{name} reliability programme", "team": team_name, "description": f"Reliability and scaling initiative for {name}."})
        add_edge(graph, "Team", team_name.lower(), "DELIVERS", "Project", project_id)
        add_edge(graph, "TeamMember", member_ids[member_name], "WORKED_ON", "Project", project_id)
        add_edge(graph, "Project", project_id, "USES", "Service", service_id)
        
        document_id = f"{service_id}-runbook"
        add_node(graph, "Document", {"id": document_id, "title": f"{name} runbook", "kind": "Runbook", "summary": f"Operational ownership and escalation guidance for {name}.", "description": f"Operational ownership and escalation guidance for {name}."})
        add_edge(graph, "Document", document_id, "DOCUMENTS", "Service", service_id)
        
        decision_id = f"{service_id}-decision"
        add_node(graph, "Decision", {"id": decision_id, "title": f"{name} operational decision", "summary": f"{team_name} owns reliability decisions for {name}.", "source": document_id, "description": f"{team_name} owns reliability decisions for {name}."})
        add_edge(graph, "Decision", decision_id, "ABOUT", "Service", service_id)
        add_edge(graph, "Decision", decision_id, "SOURCED_FROM", "Document", document_id)
        
        server_id = f"{service_id}-server"
        server_by_service[service_id] = server_id
        server_status = "failing" if status == "Degraded" else "healthy"
        add_node(graph, "Server", {"id": server_id, "name": server_id, "status": server_status, "region": region, "description": f"Compute instance running {name} in {region}."})
        add_edge(graph, "Service", service_id, "RUNS_ON", "Server", server_id)
        
        for customer_index in range(2):
            customer_id = f"{service_id}-customer-{customer_index + 1}"
            add_node(graph, "Customer", {"id": customer_id, "name": f"{name} customer {customer_index + 1}", "description": f"Enterprise customer relying on {name}."})
            add_edge(graph, "Service", service_id, "IMPACTS", "Customer", customer_id)

    dependencies = [("checkout-api", "payments"), ("checkout-api", "order-service"), ("checkout-api", "redis-cache"),
                    ("payments", "customer-db"), ("order-service", "customer-db"), ("order-service", "worker-queue"),
                    ("webhook-service", "worker-queue"), ("notification-service", "webhook-service"),
                    ("search-index", "customer-db"), ("auth-api", "redis-cache")]
    for source_id, target_id in dependencies:
        add_edge(graph, "Service", source_id, "DEPENDS_ON", "Service", target_id)

    incidents = [
        ("checkout-latency", "Checkout API latency spike", "checkout-api", "SEV 1", "Investigating", 1284, "p95 latency is above the checkout SLO; payment calls are the leading dependency."),
        ("queue-backlog", "Worker queue backlog growing", "worker-queue", "SEV 2", "Monitoring", 426, "Queue depth is above the operating threshold and job completion is delayed."),
        ("webhook-delays", "Webhook delivery delays", "webhook-service", "SEV 3", "Investigating", 92, "Delivery time is elevated for outbound customer webhook notifications."),
    ]
    for index, (incident_id, title, service_id, severity, status, impact, description) in enumerate(incidents):
        service = service_by_id[service_id]
        add_node(graph, "Incident", {"id": incident_id, "title": title, "description": description, "severity": severity, "status": status, "impact": impact, "region": service["region"], "created_at": (now - timedelta(minutes=(index + 1) * 12)).isoformat()})
        add_edge(graph, "Incident", incident_id, "REPORTED_ON", "Server", server_by_service[service_id])

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--graph", default="companybrain")
    args = parser.parse_args()
    if not args.reset:
        parser.error("Refusing to delete existing graph data. Re-run with --reset to seed the demo graph.")
    generate_synthetic_graph(args.graph)
"""MCP tools for agents working with the Synapse company graph.

Run from the repository root with ``python -m backend.mcp_server``. The stdio
transport is intended for local MCP clients; FastAPI remains the web API.
"""
from mcp.server.fastmcp import FastMCP

from backend.main import (
    find_responsible_owner as graph_owner_lookup,
    route_incident_to_graph_owner as graph_route_incident,
    search_company_knowledge as graph_knowledge_search,
    trace_downstream_impact as graph_impact_lookup,
)


mcp = FastMCP(
    "Synapse Company Graph",
    instructions=(
        "Use graph evidence to investigate incidents and answer company questions. "
        "Run impact and ownership lookups before recommending an incident route. "
        "Use company knowledge search for people, teams, services, projects, documents, and decisions. "
        "Routing writes an auditable AgentAction to FalkorDB."
    ),
)


@mcp.tool()
def trace_downstream_impact(incident_id: str) -> list[dict]:
    """Trace an incident through its reported server and service to impacted customers."""
    return graph_impact_lookup(incident_id)


@mcp.tool()
def find_responsible_owner(incident_id: str) -> list[dict]:
    """Find the TeamMember who owns the service connected to an incident."""
    return graph_owner_lookup(incident_id)


@mcp.tool()
def search_company_knowledge(query: str) -> dict:
    """Search graph-linked people, teams, services, projects, documents, decisions, and incidents."""
    return graph_knowledge_search(query)


@mcp.tool()
def route_incident_to_graph_owner(incident_id: str) -> dict:
    """Assign an incident to its graph owner and persist an auditable AgentAction."""
    return graph_route_incident(incident_id)


if __name__ == "__main__":
    mcp.run(transport="stdio")

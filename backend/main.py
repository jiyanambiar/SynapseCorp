from fastapi import FastAPI
from pydantic import BaseModel
from falkordb import FalkorDB
from fastapi.responses import RedirectResponse

app = FastAPI()
db = FalkorDB(host="localhost", port=6379)

class TriageRequest(BaseModel):
    incident_id: str

@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")

@app.get("/incidents")
def get_incidents():
    graph = db.select_graph("companybrain")
    query = "MATCH (i:Incident) RETURN i.id, i.description"
    result = graph.query(query).result_set
    return [{"id": row[0], "description": row[1]} for row in result]

@app.post("/triage")
def run_triage(request: TriageRequest):
    graph = db.select_graph("companybrain")
    
    impact_query = """
        MATCH (i:Incident {id: $inc_id})-[:REPORTED_ON]->(s:Server)<-[:RUNS_ON]-(srv:Service)-[:IMPACTS]->(c:Customer)
        RETURN srv.name, c.name
    """
    impact_raw = graph.query(impact_query, {'inc_id': request.incident_id}).result_set
    impact_res = [{"service": row[0], "customer": row[1]} for row in impact_raw]
    
    owner_query = """
        MATCH (i:Incident {id: $inc_id})-[:REPORTED_ON]->(s:Server)<-[:RUNS_ON]-(srv:Service)<-[:OWNS]-(t:TeamMember)
        RETURN srv.name, t.name
    """
    owner_raw = graph.query(owner_query, {'inc_id': request.incident_id}).result_set
    owner_res = [{"service": row[0], "owner": row[1]} for row in owner_raw]

    return {
        "incident": request.incident_id,
        "downstream_impact": impact_res,
        "personnel_routing": owner_res
    }

@app.get("/graph/topology")
def get_topology():
    graph = db.select_graph("companybrain")
    
    nodes_query = "MATCH (n) RETURN id(n), labels(n), properties(n)"
    edges_query = "MATCH (n)-[r]->(m) RETURN id(n), id(m), type(r)"
    
    nodes_raw = graph.query(nodes_query).result_set
    edges_raw = graph.query(edges_query).result_set
    
    nodes = [{"id": n[0], "label": n[1][0] if n[1] else None, "props": n[2]} for n in nodes_raw]
    edges = [{"source": e[0], "target": e[1], "type": e[2]} for e in edges_raw]
    
    return {"nodes": nodes, "edges": edges}

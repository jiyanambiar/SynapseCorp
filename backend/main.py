from fastapi import FastAPI
from pydantic import BaseModel
from falkordb import FalkorDB

app = FastAPI()
db = FalkorDB(host="localhost", port=6379)

class TriageRequest(BaseModel):
    incident_id: str

@app.post("/triage")
def run_triage(request: TriageRequest):
    graph = db.select_graph("companybrain")
    
    impact_query = f"""
        MATCH (i:Incident {{id: '{request.incident_id}'}})-[:REPORTED_ON]->(s:Server)<-[:RUNS_ON]-(srv:Service)-[:IMPACTS]->(c:Customer)
        RETURN srv.name AS service, c.name AS customer
    """
    impact_res = graph.query(impact_query).result_set
    
    owner_query = f"""
        MATCH (i:Incident {{id: '{request.incident_id}'}})-[:REPORTED_ON]->(s:Server)<-[:RUNS_ON]-(srv:Service)<-[:OWNS]-(t:TeamMember)
        RETURN srv.name AS service, t.name AS owner
    """
    owner_res = graph.query(owner_query).result_set

    return {
        "incident": request.incident_id,
        "downstream_impact": impact_res,
        "personnel_routing": owner_res
    }

@app.get("/graph/topology")
def get_topology():
    graph = db.select_graph("companybrain")
    
    nodes_query = "MATCH (n) RETURN id(n) AS id, labels(n) AS label, properties(n) AS props"
    edges_query = "MATCH (n)-[r]->(m) RETURN id(n) AS source, id(m) AS target, type(r) AS type"
    
    nodes = graph.query(nodes_query).result_set
    edges = graph.query(edges_query).result_set
    
    return {"nodes": nodes, "edges": edges}

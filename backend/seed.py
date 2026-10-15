import random
from falkordb import FalkorDB

def generate_synthetic_graph():
    db = FalkorDB(host="localhost", port=6379)
    g = db.select_graph("companybrain")
    
    g.query("MATCH (n) DETACH DELETE n")
    
    names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley"]
    services = ["AuthAPI", "PaymentService", "UserDashboard", "SearchEngine", "DataPipeline"]
    companies = ["AcmeCorp", "Globex", "Initech", "Soylent", "Umbrella"]
    
    t0, t1 = random.sample(names, 2)
    srv0, srv1 = random.sample(services, 2)
    c0, c1 = random.sample(companies, 2)
    
    g.query(f"""
    CREATE (t0:TeamMember {{name: '{t0}'}}), (t1:TeamMember {{name: '{t1}'}})
    CREATE (s0:Server {{name: 'server-001', status: 'failing'}}), (s1:Server {{name: 'server-002', status: 'healthy'}})
    CREATE (srv0:Service {{name: '{srv0}'}}), (srv1:Service {{name: '{srv1}'}})
    CREATE (c0:Customer {{name: '{c0}'}}), (c1:Customer {{name: '{c1}'}})
    
    CREATE (t0)-[:OWNS]->(srv0)
    CREATE (srv0)-[:RUNS_ON]->(s0)
    CREATE (srv0)-[:IMPACTS]->(c0)
    
    CREATE (t1)-[:OWNS]->(srv1)
    CREATE (srv1)-[:RUNS_ON]->(s1)
    CREATE (srv1)-[:IMPACTS]->(c1)
    
    CREATE (srv1)-[:DEPENDS_ON]->(srv0)
    """)

    for _ in range(3):
        inc_id = f"INC-{random.randint(1000, 9999)}"
        g.query(f"MATCH (s:Server {{name: 'server-001'}}) CREATE (:Incident {{id: '{inc_id}', description: 'CPU Spike Detected'}})-[:REPORTED_ON]->(s)")

    print("\n✅ SUCCESS: Database seeded with 3 randomized incidents!\n")

if __name__ == "__main__":
    generate_synthetic_graph()

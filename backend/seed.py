from faker import Faker
from falkordb import FalkorDB

def generate_synthetic_graph():
    fake = Faker()
    db = FalkorDB(host="localhost", port=6379)
    g = db.select_graph("companybrain")
    
    g.query("MATCH (n) DETACH DELETE n")
    
    params = {
        't0': fake.name(),
        't1': fake.name(),
        's0': 'server-001',
        's1': 'server-002',
        'srv0': f"{fake.word().capitalize()}Service",
        'srv1': f"{fake.word().capitalize()}Service",
        'c0': fake.company(),
        'c1': fake.company(),
        'inc_id': 'INC-9942'
    }
    
    g.query("""
        CREATE (t0:TeamMember {name: $t0}), (t1:TeamMember {name: $t1})
        CREATE (s0:Server {name: $s0, status: 'failing'}), (s1:Server {name: $s1, status: 'healthy'})
        CREATE (srv0:Service {name: $srv0}), (srv1:Service {name: $srv1})
        CREATE (c0:Customer {name: $c0}), (c1:Customer {name: $c1})
        CREATE (inc:Incident {id: $inc_id, description: 'CPU Spike Detected'})
        
        CREATE (t0)-[:OWNS]->(srv0)
        CREATE (srv0)-[:RUNS_ON]->(s0)
        CREATE (srv0)-[:IMPACTS]->(c0)
        
        CREATE (t1)-[:OWNS]->(srv1)
        CREATE (srv1)-[:RUNS_ON]->(s1)
        CREATE (srv1)-[:IMPACTS]->(c1)
        
        CREATE (srv1)-[:DEPENDS_ON]->(srv0)
        CREATE (inc)-[:REPORTED_ON]->(s0)
    """, params)

if __name__ == "__main__":
    generate_synthetic_graph()

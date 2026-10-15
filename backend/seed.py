from faker import Faker
from falkordb import FalkorDB

def generate_synthetic_graph():
    fake = Faker()
    db = FalkorDB(host="localhost", port=6379)
    g = db.select_graph("companybrain")
    
    g.query("MATCH (n) DETACH DELETE n")
    
    t_name = fake.name()
    s_name = "server-001"
    srv_name = f"{fake.word().capitalize()}API"
    c_name = fake.company()
    inc_id = "INC-9942"
    
    g.query("CREATE (:TeamMember {name: $name})", {'name': t_name})
    g.query("CREATE (:Server {name: $name, status: 'failing'})", {'name': s_name})
    g.query("CREATE (:Service {name: $name})", {'name': srv_name})
    g.query("CREATE (:Customer {name: $name})", {'name': c_name})
    g.query("CREATE (:Incident {id: $id, description: 'CPU Spike'})", {'id': inc_id})
    
    g.query("""
        MATCH (t:TeamMember {name: $t}), (s:Server {name: $s}), (srv:Service {name: $srv}), (c:Customer {name: $c}), (inc:Incident {id: $inc})
        CREATE (t)-[:OWNS]->(srv)
        CREATE (srv)-[:RUNS_ON]->(s)
        CREATE (srv)-[:IMPACTS]->(c)
        CREATE (inc)-[:REPORTED_ON]->(s)
    """, {'t': t_name, 's': s_name, 'srv': srv_name, 'c': c_name, 'inc': inc_id})

if __name__ == "__main__":
    generate_synthetic_graph()

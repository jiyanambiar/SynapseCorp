from faker import Faker
from falkordb import FalkorDB

def generate_synthetic_graph():
    fake = Faker()
    db = FalkorDB(host="localhost", port=6379)
    g = db.select_graph("companybrain")

    g.query("MATCH (n) DETACH DELETE n")

    team_members = [fake.name() for _ in range(5)]
    for member in team_members:
        g.query(f"CREATE (:TeamMember {{name: '{member}'}})")

    servers = [f"server-{i:03d}" for i in range(1, 6)]
    for server in servers:
        status = "failing" if server == "server-001" else "healthy"
        g.query(f"CREATE (:Server {{name: '{server}', status: '{status}'}})")

    services = [f"{fake.word().capitalize()}Service" for _ in range(5)]
    for i, service in enumerate(services):
        owner = team_members[i % len(team_members)]
        server = servers[i % len(servers)]
        
        g.query(f"""
            MATCH (t:TeamMember {{name: '{owner}'}}), (s:Server {{name: '{server}'}})
            CREATE (srv:Service {{name: '{service}'}})
            CREATE (t)-[:OWNS]->(srv)
            CREATE (srv)-[:RUNS_ON]->(s)
        """)

    g.query(f"""
        MATCH (s1:Service {{name: '{services[1]}'}}), (s0:Service {{name: '{services[0]}'}})
        CREATE (s1)-[:DEPENDS_ON]->(s0)
    """)
    g.query(f"""
        MATCH (s2:Service {{name: '{services[2]}'}}), (s0:Service {{name: '{services[0]}'}})
        CREATE (s2)-[:DEPENDS_ON]->(s0)
    """)

    customers = [fake.company() for _ in range(4)]
    for i, customer in enumerate(customers):
        clean_customer = customer.replace("'", "")
        g.query(f"CREATE (:Customer {{name: '{clean_customer}'}})")
        
        service_dep = services[i % len(services)]
        g.query(f"""
            MATCH (c:Customer {{name: '{clean_customer}'}}), (srv:Service {{name: '{service_dep}'}})
            CREATE (srv)-[:IMPACTS]->(c)
        """)

    g.query("""
        MATCH (s:Server {name: 'server-001'})
        CREATE (inc:Incident {id: 'INC-9942', description: 'CPU Spike Detected'})
        CREATE (inc)-[:REPORTED_ON]->(s)
    """)

if __name__ == "__main__":
    generate_synthetic_graph()

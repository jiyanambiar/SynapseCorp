import random
from falkordb import FalkorDB

def generate_synthetic_graph():
    db = FalkorDB(host="localhost", port=6379)
    g = db.select_graph("companybrain")

    g.query("MATCH (n) DETACH DELETE n")

    team_members = ["Prarabdha", "Jiya", "Alex", "Sam", "Taylor"]
    for member in team_members:
        g.query(f"CREATE (:TeamMember {{name: '{member}'}})")

    servers = [f"server-{i:03d}" for i in range(1, 6)]
    for server in servers:
        status = "failing" if server == "server-004" else "healthy"
        g.query(f"CREATE (:Server {{name: '{server}', status: '{status}'}})")

    services = ["AuthService", "PaymentAPI", "UserDashboard", "NotificationService", "SearchEngine"]
    for i, service in enumerate(services):
        owner = team_members[i % len(team_members)]
        server = servers[i % len(servers)]
        
        g.query(f"""
            MATCH (t:TeamMember {{name: '{owner}'}}), (s:Server {{name: '{server}'}})
            CREATE (srv:Service {{name: '{service}'}})
            CREATE (t)-[:OWNS]->(srv)
            CREATE (srv)-[:RUNS_ON]->(s)
        """)

    g.query("""
        MATCH (payment:Service {name: 'PaymentAPI'}), (auth:Service {name: 'AuthService'})
        CREATE (payment)-[:DEPENDS_ON]->(auth)
    """)
    g.query("""
        MATCH (dash:Service {name: 'UserDashboard'}), (auth:Service {name: 'AuthService'})
        CREATE (dash)-[:DEPENDS_ON]->(auth)
    """)

    customers = ["AcmeCorp", "Globex", "Initech", "Soylent"]
    for i, customer in enumerate(customers):
        g.query(f"CREATE (:Customer {{name: '{customer}'}})")
        
        service_dep = services[i % 2]
        g.query(f"""
            MATCH (c:Customer {{name: '{customer}'}}), (srv:Service {{name: '{service_dep}'}})
            CREATE (srv)-[:IMPACTS]->(c)
        """)

    g.query("""
        MATCH (s:Server {name: 'server-004'})
        CREATE (inc:Incident {id: 'INC-9942', description: 'CPU Spike Detected'})
        CREATE (inc)-[:REPORTED_ON]->(s)
    """)

if __name__ == "__main__":
    generate_synthetic_graph()

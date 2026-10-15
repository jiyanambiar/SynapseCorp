from faker import Faker
from falkordb import FalkorDB

def generate_synthetic_graph():
    fake = Faker()
    db = FalkorDB(host="localhost", port=6379)
    g = db.select_graph("companybrain")

    g.query("MATCH (n) DETACH DELETE n")

    t = [fake.first_name() for _ in range(5)]
    s = [f"server-{i:03d}" for i in range(1, 6)]
    srv = [f"{fake.domain_word().capitalize()}Service" for _ in range(5)]
    c = [fake.company().replace("'", "").replace('"', '').replace(',', '') for _ in range(4)]

    query = f"""
    CREATE (t0:TeamMember {{name: '{t[0]}'}}),
           (t1:TeamMember {{name: '{t[1]}'}}),
           (t2:TeamMember {{name: '{t[2]}'}}),
           (t3:TeamMember {{name: '{t[3]}'}}),
           (t4:TeamMember {{name: '{t[4]}'}}),
           (s0:Server {{name: '{s[0]}', status: 'failing'}}),
           (s1:Server {{name: '{s[1]}', status: 'healthy'}}),
           (s2:Server {{name: '{s[2]}', status: 'healthy'}}),
           (s3:Server {{name: '{s[3]}', status: 'healthy'}}),
           (s4:Server {{name: '{s[4]}', status: 'healthy'}}),
           (srv0:Service {{name: '{srv[0]}'}}),
           (srv1:Service {{name: '{srv[1]}'}}),
           (srv2:Service {{name: '{srv[2]}'}}),
           (srv3:Service {{name: '{srv[3]}'}}),
           (srv4:Service {{name: '{srv[4]}'}}),
           (c0:Customer {{name: '{c[0]}'}}),
           (c1:Customer {{name: '{c[1]}'}}),
           (c2:Customer {{name: '{c[2]}'}}),
           (c3:Customer {{name: '{c[3]}'}}),
           (inc:Incident {{id: 'INC-9942', description: 'CPU Spike Detected'}}),
           (t0)-[:OWNS]->(srv0), (srv0)-[:RUNS_ON]->(s0),
           (t1)-[:OWNS]->(srv1), (srv1)-[:RUNS_ON]->(s1),
           (t2)-[:OWNS]->(srv2), (srv2)-[:RUNS_ON]->(s2),
           (t3)-[:OWNS]->(srv3), (srv3)-[:RUNS_ON]->(s3),
           (t4)-[:OWNS]->(srv4), (srv4)-[:RUNS_ON]->(s4),
           (srv1)-[:DEPENDS_ON]->(srv0),
           (srv2)-[:DEPENDS_ON]->(srv0),
           (srv0)-[:IMPACTS]->(c0),
           (srv1)-[:IMPACTS]->(c1),
           (srv2)-[:IMPACTS]->(c2),
           (srv3)-[:IMPACTS]->(c3),
           (inc)-[:REPORTED_ON]->(s0)
    """
    g.query(query)

if __name__ == "__main__":
    generate_synthetic_graph()

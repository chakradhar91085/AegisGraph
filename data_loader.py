import pandas as pd
import networkx as nx
import os
from config import DATA_CSV_PATH

def generate_mock_data():
    """Generates a massive professional company graph."""
    data = [
        # Executives
        {"source": "Eve_CEO", "relation": "runs", "target": "TechCorp", "source_type": "Executive", "target_type": "Organization"},
        {"source": "Dave_VP_Eng", "relation": "reports_to", "target": "Eve_CEO", "source_type": "Executive", "target_type": "Executive"},
        {"source": "Sarah_VP_Fin", "relation": "reports_to", "target": "Eve_CEO", "source_type": "Executive", "target_type": "Executive"},
        {"source": "Tom_VP_HR", "relation": "reports_to", "target": "Eve_CEO", "source_type": "Executive", "target_type": "Executive"},
        
        # Management Layer
        {"source": "Bob_Manager", "relation": "reports_to", "target": "Dave_VP_Eng", "source_type": "Management", "target_type": "Executive"},
        {"source": "Carol_Manager", "relation": "reports_to", "target": "Dave_VP_Eng", "source_type": "Management", "target_type": "Executive"},
        {"source": "Dan_Manager", "relation": "reports_to", "target": "Sarah_VP_Fin", "source_type": "Management", "target_type": "Executive"},
        {"source": "Frank_Manager", "relation": "reports_to", "target": "Tom_VP_HR", "source_type": "Management", "target_type": "Executive"},
        
        {"source": "Bob_Manager", "relation": "manages", "target": "Engineering_Core", "source_type": "Management", "target_type": "Department"},
        {"source": "Carol_Manager", "relation": "manages", "target": "Engineering_Ops", "source_type": "Management", "target_type": "Department"},
        {"source": "Dan_Manager", "relation": "manages", "target": "Finance", "source_type": "Management", "target_type": "Department"},
        {"source": "Frank_Manager", "relation": "manages", "target": "HR", "source_type": "Management", "target_type": "Department"},

        # Employees (Core Engineering) -> Bob
        {"source": "Alice", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "John", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Mark", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Emily", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Chris", "relation": "reports_to", "target": "Bob_Manager", "source_type": "Employee", "target_type": "Management"},
        
        # Employees (Eng Ops) -> Carol
        {"source": "Nancy", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Peter", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Rachel", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Sam", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Tina", "relation": "reports_to", "target": "Carol_Manager", "source_type": "Employee", "target_type": "Management"},

        # Employees (Finance) -> Dan
        {"source": "Charlie", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "George", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Hannah", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Ivan", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Jenny", "relation": "reports_to", "target": "Dan_Manager", "source_type": "Employee", "target_type": "Management"},
        
        # Employees (HR) -> Frank
        {"source": "Kelly", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Laura", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Mike", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Nina", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},
        {"source": "Oscar", "relation": "reports_to", "target": "Frank_Manager", "source_type": "Employee", "target_type": "Management"},

        # Projects and Assignees
        {"source": "Alice", "relation": "works_on", "target": "Project_Titan", "source_type": "Employee", "target_type": "Project"},
        {"source": "John", "relation": "works_on", "target": "Project_Titan", "source_type": "Employee", "target_type": "Project"},
        {"source": "Charlie", "relation": "works_on", "target": "Project_Oasis", "source_type": "Employee", "target_type": "Project"},
        {"source": "Nancy", "relation": "works_on", "target": "Project_Apollo", "source_type": "Employee", "target_type": "Project"},
        {"source": "Sam", "relation": "works_on", "target": "Project_Apollo", "source_type": "Employee", "target_type": "Project"},
        {"source": "Frank_Manager", "relation": "owns", "target": "Project_Zeus", "source_type": "Management", "target_type": "Project"},
        {"source": "Rachel", "relation": "works_on", "target": "Project_Hermes", "source_type": "Employee", "target_type": "Project"},

        # Tech Stack and Assets
        {"source": "Engineering_Core", "relation": "maintains", "target": "Auth_Gateway", "source_type": "Department", "target_type": "Microservice"},
        {"source": "Finance", "relation": "audits", "target": "Payment_Queue", "source_type": "Department", "target_type": "Microservice"},
        
        # Data Stores
        {"source": "Project_Titan", "relation": "reads_from", "target": "Customer_DB", "source_type": "Project", "target_type": "Database"},
        {"source": "Project_Apollo", "relation": "writes_to", "target": "S3_Logs_Bucket", "source_type": "Project", "target_type": "Database"},
        {"source": "Auth_Gateway", "relation": "writes_to", "target": "Auth_DB", "source_type": "Microservice", "target_type": "Database"},
        {"source": "Customer_DB", "relation": "contains", "target": "PII_Records", "source_type": "Database", "target_type": "Data_Asset"},
        
        # Infrastructure and Networking
        {"source": "Customer_DB", "relation": "deployed_in", "target": "AWS_VPC_Prod", "source_type": "Database", "target_type": "Network_Zone"},
        {"source": "S3_Logs_Bucket", "relation": "deployed_in", "target": "AWS_VPC_Prod", "source_type": "Database", "target_type": "Network_Zone"},
        {"source": "Auth_Gateway", "relation": "deployed_in", "target": "AWS_VPC_Prod", "source_type": "Microservice", "target_type": "Network_Zone"},
        {"source": "Project_Oasis", "relation": "deployed_in", "target": "AWS_VPC_Dev", "source_type": "Project", "target_type": "Network_Zone"},
        {"source": "AWS_VPC_Prod", "relation": "enforces", "target": "Zero_Trust_Policy", "source_type": "Network_Zone", "target_type": "Security_Policy"}
    ]
    df = pd.DataFrame(data)
    df.to_csv(DATA_CSV_PATH, index=False)
    return df

def load_graph():
    """Loads the dataset and builds a NetworkX DiGraph."""
    if not os.path.exists(DATA_CSV_PATH):
        df = generate_mock_data()
    else:
        df = pd.read_csv(DATA_CSV_PATH)
        
    G = nx.DiGraph()
    for _, row in df.iterrows():
        source = str(row['source'])
        target = str(row['target'])
        relation = str(row['relation'])
        source_type = str(row.get('source_type', 'Entity'))
        target_type = str(row.get('target_type', 'Entity'))
        
        G.add_node(source, type=source_type)
        G.add_node(target, type=target_type)
        G.add_edge(source, target, relation=relation)
        
    return G, df

G, df = load_graph()
GRAPH_NODES = list(G.nodes())

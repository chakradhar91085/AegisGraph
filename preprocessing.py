from sentence_transformers import SentenceTransformer
import re

# Load the lightweight model once
model = SentenceTransformer('all-MiniLM-L6-v2')

def clean_query(text: str) -> str:
    """Removes special characters and normalizes spaces."""
    text = re.sub(r'[^\w\s]', '', text)
    return text.lower().strip()

def extract_entities(query: str, graph_nodes: list) -> list:
    """Extract entities from the query that match graph nodes."""
    query_lower = query.lower()
    query_words = set(query_lower.split())
    entities = []
    for node in graph_nodes:
        node_lower = node.lower()
        node_clean = node_lower.replace("_", " ")
        base_name = node_lower.split("_")[0]
        
        if node_clean in query_lower or node_lower in query_lower:
            entities.append(node)
        elif base_name in query_words:
            entities.append(node)
    # Removing duplicates while preserving order
    return list(dict.fromkeys(entities))

def generate_embedding(query: str) -> list:
    """Returns vector embedding for the query."""
    embedding = model.encode(query).tolist()
    return embedding

def preprocess(query: str, graph_nodes: list) -> dict:
    clean_q = clean_query(query)
    entities = extract_entities(clean_q, graph_nodes)
    embedding = generate_embedding(clean_q)
    return {
        "clean_query": clean_q,
        "entities": entities,
        "embedding": embedding
    }

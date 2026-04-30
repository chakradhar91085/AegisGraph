import networkx as nx
from data_loader import G

def bfs_traversal(entity: str, clean_query: str = "") -> list:
    """Detect breadth exploration (direct neighbors)."""
    if entity not in G:
        return []
    neighbors = []
    # Both successors and predecessors for breadth
    for neighbor in G.successors(entity):
        rel = G.edges[entity, neighbor]['relation']
        neighbors.append({"source": entity, "relation": rel, "target": neighbor})
    for neighbor in G.predecessors(entity):
        rel = G.edges[neighbor, entity]['relation']
        neighbors.append({"source": neighbor, "relation": rel, "target": entity})
        
    # Intent Filtering based on query context
    filtered = []
    if "manage" in clean_query:
        for n in neighbors:
            if n['relation'] == 'manages' or (n['relation'] == 'reports_to' and n['target'] == entity):
                filtered.append(n)
    elif "report" in clean_query:
        for n in neighbors:
            if n['relation'] == 'reports_to' and n['source'] == entity:
                filtered.append(n)
                
    if filtered:
        return filtered
    return neighbors

def dfs_traversal(entity: str, k: int = 2) -> list:
    """Detect deep traversal (k-hop depth search)."""
    if entity not in G:
        return []
    edges = set()
    current_layer = {entity}
    for _ in range(k):
        next_layer = set()
        for node in current_layer:
            for neighbor in G.successors(node):
                rel = G.edges[node, neighbor]['relation']
                edges.add((node, rel, neighbor))
                next_layer.add(neighbor)
            for prev in G.predecessors(node):
                rel = G.edges[prev, node]['relation']
                edges.add((prev, rel, node))
                next_layer.add(prev)
        current_layer = next_layer
    return [{"source": s, "relation": r, "target": t} for s, r, t in edges]

def find_simple_paths(source: str, target: str) -> list:
    """Detect relationship queries between specific entities."""
    if source not in G or target not in G:
        return []
    try:
        paths = list(nx.all_simple_paths(G, source=source, target=target, cutoff=3))
        formatted_paths = []
        for path in paths:
            path_edges = []
            for i in range(len(path)-1):
                u, v = path[i], path[i+1]
                rel = G.edges[u, v]['relation']
                path_edges.append({"source": u, "relation": rel, "target": v})
            formatted_paths.append(path_edges)
        return formatted_paths
    except nx.NetworkXNoPath:
        return []

def subgraph_tracking(entities: list) -> list:
    """Monitor extracted nodes/edges for a subset of entities."""
    subgraph = G.subgraph(entities)
    edges = []
    for u, v, data in subgraph.edges(data=True):
        edges.append({"source": u, "relation": data['relation'], "target": v})
    return edges

def execute_query(entities: list, clean_query: str) -> list:
    """Simple router to decide which graph traversal to use."""
    if not entities:
        return []
    
    if len(entities) == 1:
        # Check basic keywords for depth
        if "deep" in clean_query or "all" in clean_query:
            return dfs_traversal(entities[0], k=2)
        else:
            return bfs_traversal(entities[0], clean_query)
    elif len(entities) == 2:
        return find_simple_paths(entities[0], entities[1])
    elif len(entities) > 2:
        return subgraph_tracking(entities)
    return []

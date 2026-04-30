from config import RESPONSE_MODE_FULL, RESPONSE_MODE_FILTERED, RESPONSE_MODE_RESTRICTED
from data_loader import G

def format_filtered_response(raw_results: list) -> str:
    """Hides relation labels."""
    if not raw_results:
        return "No data found or entities unrecognized."
    
    output = "Filtered Results:\n"
    for item in raw_results:
        # Handle path list
        if isinstance(item, list):
            for step in item:
                output += f"- {step['source']} -> <HIDDEN> -> {step['target']}\n"
        else:
            output += f"- {item['source']} -> <HIDDEN> -> {item['target']}\n"
    return output

def format_full_response(raw_results: list) -> str:
    """Returns full graph relations."""
    if not raw_results:
        return "No data found or entities unrecognized."
        
    output = "Full Results:\n"
    for item in raw_results:
        # Handle path
        if isinstance(item, list):
             output += "Path: " + " => ".join([f"{step['source']} ({step['relation']}) {step['target']}" for step in item]) + "\n"
        else:
            output += f"- {item['source']} [{item['relation']}] {item['target']}\n"
    return output

def format_restricted_response(entities: list) -> str:
    """Provides a vague, abstracted response based purely on targeted entities without hitting the database."""
    if not entities:
        return "Internal details are unavailable."
        
    output = "Abstracted System Topology:\n"
    for entity in entities:
        if entity in G.nodes:
            entity_type = G.nodes[entity].get('type', 'Entity')
            output += f"- A [{entity_type}] is generally linked to internal corporate structures.\n"
            
    if len(entities) >= 2 and entities[0] in G.nodes and entities[1] in G.nodes:
        type1 = G.nodes[entities[0]].get('type', 'Entity')
        type2 = G.nodes[entities[1]].get('type', 'Entity')
        output = f"Abstracted System Topology:\n- A [{type1}] interacts with a [{type2}].\n"
        
    output += "\n*(Details abstractified per corporate security policy)*"
    return output

def apply_response_control(raw_results: list, response_mode: str, entities: list = None) -> str:
    """Applies the decided response mode to the raw graph results."""
    if response_mode == RESPONSE_MODE_RESTRICTED:
        return format_restricted_response(entities if entities else [])
    elif response_mode == RESPONSE_MODE_FILTERED:
        return format_filtered_response(raw_results)
    else:
        return format_full_response(raw_results)

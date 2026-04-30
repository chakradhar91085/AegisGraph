import streamlit as st
import pandas as pd

# Important: set page config before any other st calls
st.set_page_config(page_title="AegisGraph", layout="wide")

import ui
import preprocessing
import behavior_analysis
import risk_scoring
import decision_engine
import graph_query
import response_control
import logger
import user_profile
from data_loader import GRAPH_NODES

# 1. Render UI components that don't depend on query state
role, user_id = ui.render_sidebar()

st.title("AegisGraph: Dynamic Query Playground")

if not user_id:
    st.warning("Please login via the sidebar to continue.")
    st.stop()

st.markdown("Try querying the graph (e.g., `Who manages Alice?` or `What classification does Project_Titan have?`). Probe multiple times to trigger risk rules.")

# Input box
with st.form("query_form"):
    raw_query = st.text_input("Enter your query:", "")
    submit = st.form_submit_button("Submit")

# Hardcoded mock IP for the demonstration to match the architectural diagram
mock_ip_address = f"192.168.1.{sum(ord(c) for c in user_id) % 255}" if user_id else "127.0.0.1"

if submit and raw_query:
    # 2. Preprocessing
    prep_data = preprocessing.preprocess(raw_query, GRAPH_NODES)
    
    # 3. Behavior Analysis
    behavior_signals = behavior_analysis.analyze_behavior(
        current_query=raw_query,
        current_clean=prep_data["clean_query"],
        current_entities=prep_data["entities"],
        current_embedding=prep_data["embedding"],
        user_id=user_id
    )
    
    # Fetch profile to evaluate historical risk
    current_profile = user_profile.get_user_profile(user_id)
    
    # 4. Compute Risk (Now profiled)
    risk_score, risk_level = risk_scoring.compute_risk(behavior_signals, role, current_profile)
    
    # 5. Decide Response Mode
    response_mode = decision_engine.get_response_mode(risk_level)
    
    # 6. Gate Graph Query Check
    # We DO NOT query the graph if the user is in highly restricted mode.
    if response_mode == "RESTRICTED":
        raw_graph_results = []
    else:
        raw_graph_results = graph_query.execute_query(prep_data["entities"], prep_data["clean_query"])
    
    # 7. Apply Response Control
    final_output = response_control.apply_response_control(raw_graph_results, response_mode, prep_data["entities"])
    
    # 8. Log Everything
    logger.log_query(
        user_id=user_id,
        user_role=role,
        raw_query=raw_query,
        clean_query=prep_data["clean_query"],
        entities=prep_data["entities"],
        similarity_score=behavior_signals["similarity_score"],
        risk_score=risk_score,
        risk_level=risk_level,
        response_mode=response_mode,
        ip_address=mock_ip_address
    )
    
    # 9. Update Profile
    user_profile.update_user_profile(user_id, role, risk_score, risk_level)
    
    # Render Dynamic Dashboard
    st.markdown("---")
    ui.render_dashboard(risk_score, risk_level, response_mode)
    
    st.subheader("Response")
    st.text_area("Output", final_output, height=150, disabled=True)

    with st.expander("Debug Metadata"):
        st.write("Entities Extracted:", prep_data["entities"])
        st.write("Behavior Signals:", behavior_signals)
        if response_mode != "RESTRICTED":
            st.write("Raw Graph Traversal Result:", raw_graph_results)
        else:
            st.warning("Graph Traversal aborted due to HIGH risk policy. Database untouched.")

st.markdown("---")
ui.render_logs(user_id)
ui.render_user_profile(user_profile.get_user_profile(user_id))

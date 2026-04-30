import streamlit as st
import pandas as pd
import bcrypt
import streamlit.components.v1 as components
from pyvis.network import Network
from db import get_connection

def render_sidebar():
    st.sidebar.title("🛡️ AegisGraph")
    st.sidebar.markdown("Privacy-Aware Security Framework for Knowledge Graph QA Systems")
    
    st.sidebar.subheader("Authentication")
    if "authenticated_user" not in st.session_state:
        st.session_state.authenticated_user = None
        st.session_state.user_role = None

    if st.session_state.authenticated_user is None:
        auth_mode = st.sidebar.radio("Mode", ["Login", "Register"])
        
        with st.sidebar.form("auth_form"):
            username = st.text_input("Username", "")
            password = st.text_input("Password", type="password")
            
            if auth_mode == "Register":
                role = st.selectbox("Select Role", ["Employee", "External"])
                submit = st.form_submit_button("Register")
                if submit and username and password:
                    salt = bcrypt.gensalt()
                    pwd_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
                    conn = get_connection()
                    try:
                        conn.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
                                    (username, pwd_hash, role))
                        conn.commit()
                        st.sidebar.success(f"User {username} registered! You can now login.")
                    except:
                        st.sidebar.error("Username already exists.")
                    finally:
                        conn.close()
            else:
                submit = st.form_submit_button("Login")
                if submit and username and password:
                    conn = get_connection()
                    cursor = conn.cursor()
                    cursor.execute("SELECT password_hash, role FROM users WHERE username = ?", (username,))
                    result = cursor.fetchone()
                    conn.close()
                    if result:
                        stored_hash = result[0]
                        role = result[1]
                        if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                            st.session_state.authenticated_user = username
                            st.session_state.user_role = role
                            st.rerun()
                        else:
                            st.sidebar.error("Invalid credentials.")
                    else:
                        st.sidebar.error("Invalid credentials.")
    else:
        st.sidebar.success(f"Logged in as: {st.session_state.authenticated_user}")
        st.sidebar.info(f"Role: {st.session_state.user_role}")
        if st.sidebar.button("Logout"):
            st.session_state.authenticated_user = None
            st.session_state.user_role = None
            st.rerun()
            
    st.sidebar.markdown("---")
    st.sidebar.subheader("Dataset Node Classifications")
    with st.sidebar.expander("View Graph Topography", expanded=False):
        st.write("- **Executives:** Eve_CEO, Dave_VP_Eng, Sarah_VP_Fin, Tom_VP_HR")
        st.write("- **Management:** Bob_Manager, Carol_Manager, Dan_Manager, Frank_Manager")
        st.write("- **Employees (20+):** Alice, John, Mark, Emily, Chris, Nancy, Peter, Rachel, Sam, Tina, Charlie, George, Hannah, Ivan, Jenny, Kelly, Laura, Mike, Nina, Oscar")
        st.write("- **Projects:** Project_Titan, Project_Oasis, Project_Apollo, Project_Zeus, Project_Hermes")
        st.write("- **Databases:** Customer_DB, Auth_DB, S3_Logs_Bucket")
        st.write("- **Network Zones:** AWS_VPC_Prod, AWS_VPC_Dev")
        st.write("- **Security Policies:** Zero_Trust_Policy")
    
    return st.session_state.user_role, st.session_state.authenticated_user

def render_dashboard(risk_score, risk_level, response_mode):
    col1, col2, col3 = st.columns(3)
    col1.metric("Risk Score", risk_score)
    
    if risk_level == "LOW":
        color = "🟢"
    elif risk_level == "MEDIUM":
        color = "🟡"
    else:
        color = "🔴"
        
    col2.metric("Risk Level", f"{color} {risk_level}")
    col3.metric("Response Mode", response_mode)

def render_logs(user_id: str):
    st.subheader("Query Logs (Your History)")
    if not user_id:
        st.write("Please authenticate to view logs.")
        return
        
    conn = get_connection()
    df = pd.read_sql_query("SELECT id, user_role, raw_query, entities, risk_score, risk_level, response_mode, ip_address, timestamp FROM logs WHERE user_id = ? ORDER BY id DESC LIMIT 10", conn, params=(user_id,))
    conn.close()
    st.dataframe(df, use_container_width=True)

def render_user_profile(profile_data):
    st.subheader("User Profile Metrics")
    if profile_data:
        c1, c2, c3 = st.columns(3)
        c1.metric("Total Queries", profile_data["total_queries"])
        c2.metric("Avg Risk Score", f"{profile_data['avg_risk']:.2f}")
        c3.metric("Suspicious Queries", profile_data["suspicious_count"])
    else:
        st.write("No profile data yet.")

def render_interactive_graph(G):
    net = Network(height='600px', width='100%', bgcolor='#0E1117', font_color='white', directed=True)
    # Give different colors based on type
    for node, node_attrs in G.nodes(data=True):
        n_type = node_attrs.get('type', 'Entity')
        if n_type == 'Executive':
            color = '#FF4B4B'
        elif n_type == 'Management':
            color = '#FFAA00'
        elif n_type == 'Employee':
            color = '#00B4D8'
        elif n_type == 'Project':
            color = '#00FF00'
        elif n_type == 'Microservice':
            color = '#FF00FF'
        elif n_type == 'Database':
            color = '#FFFF00'
        elif n_type == 'Network_Zone':
            color = '#8A2BE2'
        else:
            color = '#AAAAAA'
            
        net.add_node(node, label=node, title=n_type, color=color)
        
    for source, target, edge_attrs in G.edges(data=True):
        rel = edge_attrs.get('relation', '')
        net.add_edge(source, target, title=rel)
        
    net.toggle_physics(True)
    
    # Save the file out temporarily to sidestep generate_html string handling issues in some versions
    net.save_graph('temp_graph.html')
    with open('temp_graph.html', 'r', encoding='utf-8') as f:
        html = f.read()
    return html

def show_graph_ui(G):
    st.markdown("---")
    st.subheader("Interactive Topology Map")
    with st.expander("Visualize the Knowledge Graph", expanded=False):
        st.write("Zoom and drag around the physical structure of our Mock Corporate Dataset!")
        html_data = render_interactive_graph(G)
        components.html(html_data, height=600)


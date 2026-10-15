import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, initials } from "../src/api";

const links = [["Overview", "/", "⌂"], ["Incidents", "/incidents", "◉"], ["Services", "/services", "⌘"], ["Topology", "/topology", "⌬"], ["Teams", "/teams", "♙"]];
const tools = [["Investigations", "/investigations", "⌕"], ["Reports", "/reports", "▤"]];
function NavLink({ item: [label, href, glyph], active, badge }) { return <Link to={href} className={`nav-item ${active ? "active" : ""}`}><span className="icon">{glyph}</span><span>{label}</span>{badge !== undefined && <b className="nav-badge">{badge}</b>}</Link>; }
export default function Sidebar() {
  const path = useLocation().pathname; const [workspace, setWorkspace] = useState({}); const [incidentCount, setIncidentCount] = useState(null);
  useEffect(() => { api("/workspace").then(setWorkspace).catch(() => {}); api("/dashboard").then((data) => setIncidentCount(data.metrics.active_incidents)).catch(() => {}); }, []);
  const selected = (href) => href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`); const workspaceName = workspace.name || "Workspace";
  return <aside className="sidebar"><Link className="brand" to="/"><span className="brand-symbol">S</span><span>Synapse</span></Link><details className="workspace-switch"><summary><span className="workspace-avatar">{initials(workspaceName)}</span><span className="workspace-name"><strong>{workspaceName}</strong><span>FalkorDB workspace</span></span><span className="chevron">⌄</span></summary><div className="workspace-menu"><Link to="/settings">Workspace settings</Link></div></details><div className="nav-label">WORKSPACE</div><nav>{links.map((item) => <NavLink key={item[1]} item={item} active={selected(item[1])} badge={item[1] === "/incidents" && incidentCount !== null ? incidentCount : undefined} />)}</nav><div className="nav-label tools-label">TOOLS</div><nav>{tools.map((item) => <NavLink key={item[1]} item={item} active={selected(item[1])} />)}</nav><div className="sidebar-bottom"><details className="profile-menu"><summary className="user-profile"><span className="user-avatar">{initials(workspace.email || workspaceName)}</span><span className="profile-name"><strong>{workspace.email || "Workspace profile"}</strong><span>Stored in FalkorDB</span></span><span className="more">•••</span></summary><div className="workspace-menu profile-options"><Link to="/settings">Profile and workspace settings</Link></div></details></div></aside>;
}

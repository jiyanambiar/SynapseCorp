

import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const links = [
  ["Overview", "/", "⌂"], ["Incidents", "/incidents", "◉", "3"],
  ["Services", "/services", "⌘"], ["Topology", "/topology", "⌬"], ["Teams", "/teams", "♙"],
];
const tools = [["Investigations", "/investigations", "⌕"], ["Reports", "/reports", "▤"]];

function NavLink({ item: [label, href, glyph, badge], active }) {
  return <Link to={href} className={`nav-item ${active ? "active" : ""}`}><span className="icon">{glyph}</span><span>{label}</span>{badge && <b className="nav-badge">{badge}</b>}</Link>;
}

export default function Sidebar() {
  const path = useLocation().pathname;
  const selected = (href) => href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
  return <aside className="sidebar">
    <Link className="brand" to="/"><span className="brand-symbol">S</span><span>Synapse</span></Link>
    <details className="workspace-switch"><summary><span className="workspace-avatar">A</span><span className="workspace-name"><strong>Acme Systems</strong><span>Enterprise workspace</span></span><span className="chevron">⌄</span></summary><div className="workspace-menu"><strong>Switch workspace</strong><button onClick={(e)=>{e.currentTarget.closest("details").removeAttribute("open")}}>✓ &nbsp; Acme Systems</button><Link to="/settings">＋ &nbsp; Add workspace</Link></div></details>
    <div className="nav-label">WORKSPACE</div><nav>{links.map(item=><NavLink key={item[1]} item={item} active={selected(item[1])}/>)}</nav>
    <div className="nav-label tools-label">TOOLS</div><nav>{tools.map(item=><NavLink key={item[1]} item={item} active={selected(item[1])}/>)}</nav>
    <div className="sidebar-bottom"><div className="usage-card"><div className="usage-top"><span>Monthly investigations</span><span>68%</span></div><div className="usage-bar"><span/></div><small>68 of 100 investigations</small></div><details className="profile-menu"><summary className="user-profile"><span className="user-avatar">JM</span><span className="profile-name"><strong>Jordan Miller</strong><span>Platform engineer</span></span><span className="more">•••</span></summary><div className="workspace-menu profile-options"><Link to="/settings">Profile and workspace settings</Link><Link to="/settings">Account status</Link></div></details></div>
  </aside>;
}

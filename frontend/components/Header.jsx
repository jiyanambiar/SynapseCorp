import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../src/api";

export default function Header() {
  const pathname = useLocation().pathname;
  const [workspace, setWorkspace] = useState({});
  const [health, setHealth] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => { api("/workspace").then(setWorkspace).catch(() => {}); api("/health").then(setHealth).catch(() => setHealth({ status: "unavailable" })); }, []);
  const section = pathname === "/" ? "Overview" : pathname.split("/")[1].replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  return <><header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>{section}</strong></div><div className="top-actions"><div className="system-status"><span className="status-pulse" /> {health?.status === "ok" ? "Backend connected" : health ? "Backend unavailable" : "Checking backend"}</div><Link className="icon-button" aria-label="Open workspace settings" title="Workspace settings" to="/settings">⚙</Link><button className="top-avatar" aria-label="Open product guide" title="How Synapse works" onClick={() => setHelpOpen(true)}>?</button></div></header>
    {helpOpen && <div className="search-scrim" role="dialog" aria-modal="true" aria-label="How Synapse works" onMouseDown={(event) => { if (event.target === event.currentTarget) setHelpOpen(false); }}><section className="help-dialog"><button className="help-close" aria-label="Close guide" onClick={() => setHelpOpen(false)}>×</button><div className="section-kicker">SYNAPSE WORKFLOW</div><h2>Turn an alert into an accountable response.</h2><ol><li><strong>Open an incident.</strong> Acknowledge it to record that a responder owns the next action.</li><li><strong>Run impact & owner triage.</strong> FalkorDB follows <code>Incident → Server → Service → Customer</code> for downstream impact and <code>Service ← TeamMember</code> for personnel routing.</li><li><strong>Investigate and act.</strong> Use the resulting customer and owner evidence to coordinate the response.</li></ol><p>This workspace is built for Track 1 (downstream impact) and Track 3 (personnel routing).</p><Link className="primary-button" to="/incidents" onClick={() => setHelpOpen(false)}>Open incidents →</Link></section></div>}
  </>;
}

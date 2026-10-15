import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import WorkspacePage from "../../../components/WorkspacePage";
import { api, display, initials } from "../../../src/api";

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [triage, setTriage] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [routing, setRouting] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");

  const load = () => api(`/incidents/${encodeURIComponent(id)}`).then(setIncident).catch((requestError) => setError(requestError.message));
  useEffect(() => { setIncident(null); setTriage(null); setError(""); load(); }, [id]);

  async function acknowledge() {
    setSaving(true);
    try {
      setIncident(await api(`/incidents/${id}`, { method: "PATCH", body: JSON.stringify({ status: "Acknowledged", acknowledged_at: new Date().toISOString() }) }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function runTriage() {
    setTriaging(true);
    setError("");
    try {
      setTriage(await api("/agent/triage", { method: "POST", body: JSON.stringify({ incident_id: id }) }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTriaging(false);
    }
  }

  async function routeToRecommendedOwner() {
    setRouting(true);
    setRouteMessage("");
    try {
      const response = await api(`/incidents/${id}/route`, { method: "POST" });
      setIncident(response.incident);
      setRouteMessage(`Assigned to ${response.action.owner} from the graph ownership path.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRouting(false);
    }
  }

  if (error && !incident) return <WorkspacePage eyebrow="INCIDENT DETAIL" title="Incident unavailable" description={error} action={<button className="outline-button" onClick={() => navigate("/incidents")}>← All incidents</button>} />;
  if (!incident) return <WorkspacePage eyebrow="INCIDENT DETAIL" title="Loading incident…" description="Retrieving the incident from FalkorDB." />;
  const acknowledged = incident.status === "Acknowledged";
  return <WorkspacePage eyebrow="INCIDENT RESPONSE" title={incident.title} description="Confirm ownership, then trace affected customers and the accountable on-call owner." action={<button className="outline-button" onClick={() => navigate("/incidents")}>← &nbsp; All incidents</button>}>
    {error && <div className="empty-state panel">{error}</div>}
    <div className="detail-layout"><div className="detail-main"><section className="panel detail-overview"><div className="detail-tags"><span className="severity sev-2"><i /> {incident.severity}</span><span className="status-pill">{incident.status}</span><span className="incident-time">{display(incident.created_at, "Active incident")}</span></div><p className="detail-summary">{display(incident.description, "No description stored for this incident.")}</p><div className="detail-stats"><div><small>AFFECTED SERVICE</small>{incident.service_id ? <Link to={`/services/${incident.service_id}`}>{incident.service} ↗</Link> : <strong>—</strong>}</div><div><small>DIRECT CUSTOMER IMPACT</small><strong>{display(incident.impact, "Run triage")}</strong></div><div><small>PRIMARY OWNER</small><strong>{display(incident.assignee, "Run triage")}</strong></div></div></section>
      <section className="panel timeline-panel"><div className="panel-heading"><div><div className="section-kicker">RESPONSE LOG</div><h2>What to do next</h2></div></div><div className="timeline-item"><i className="timeline-dot" /><div><strong>{acknowledged ? "Ownership acknowledged" : "Awaiting acknowledgement"}</strong><p>{acknowledged ? "An on-call responder has accepted this incident. Continue with graph triage." : "Acknowledge to record that someone is actively responsible for the response."}</p><small>{display(incident.acknowledged_at, "Not acknowledged yet")}</small></div></div><div className="timeline-item"><i className="timeline-dot green-timeline" /><div><strong>Graph evidence</strong><p>Run triage to trace the incident’s downstream customer impact and the service owner through FalkorDB relationships.</p><small>Track 1: impact · Track 3: personnel routing</small></div></div></section>
      {triage && <section className="panel triage-result"><div className="panel-heading"><div><div className="section-kicker">GRAPH AGENT EXECUTION</div><h2>Impact and owner routing</h2></div><button className="outline-button" onClick={runTriage} disabled={triaging}>Refresh</button></div><div className="tool-run-list">{triage.tool_runs.map((tool) => <div key={tool.tool}><strong>{tool.tool}</strong><span>{tool.path}</span><small>{tool.result_count} graph result{tool.result_count === 1 ? "" : "s"} · {tool.purpose}</small></div>)}</div><div className="triage-columns"><div><small>CUSTOMERS AT RISK · {triage.summary.affected_customers}</small>{triage.downstream_impact.length ? triage.downstream_impact.map((item, index) => <p key={`${item.customer}-${index}`}><strong>{item.customer}</strong><span>impacted through {item.service}</span></p>) : <p>No customer-impact path is stored for this incident.</p>}</div><div><small>ROUTE TO OWNER · {triage.summary.responsible_owners}</small>{triage.personnel_routing.length ? triage.personnel_routing.map((item, index) => <p key={`${item.owner}-${index}`}><strong>{item.owner}</strong><span>owns {item.service}</span></p>) : <p>No owner path is stored for this incident.</p>}</div></div></section>}</div>
      <aside className="detail-side"><section className="panel response-panel"><div className="section-kicker">RESPONSE ACTIONS</div><button className="primary-button full-button" disabled={saving || acknowledged} onClick={acknowledge}>{saving ? "Saving…" : acknowledged ? "✓ Acknowledged" : "Acknowledge incident"}</button><p className="action-explainer">Acknowledging saves the response state and timestamp in FalkorDB. It does not resolve the incident.</p><button className="outline-button full-button" disabled={triaging} onClick={runTriage}>{triaging ? "Tracing graph…" : "Run graph agent triage →"}</button>{triage?.recommendation?.owner && <button className="primary-button full-button" disabled={routing} onClick={routeToRecommendedOwner}>{routing ? "Routing…" : `Assign ${triage.recommendation.owner} →`}</button>}{routeMessage && <p className="action-explainer">✓ {routeMessage}</p>}<button className="outline-button full-button" onClick={() => navigate(`/investigations?incident=${id}`)}>Open investigation workspace →</button><div className="side-divider" /><small className="side-label">ASSIGNEE</small><span className="assignee-select"><i>{initials(incident.assignee)}</i>{display(incident.assignee, "Unassigned")}</span></section></aside></div>
  </WorkspacePage>;
}

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import WorkspacePage from "../../components/WorkspacePage";
import { api, display } from "../../src/api";

export default function InvestigationsPage() {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const incidentId = new URLSearchParams(window.location.search).get("incident");
  const loadHistory = () => api("/investigations").then(setHistory).catch((e) => setError(e.message));

  useEffect(() => {
    loadHistory();
    if (incidentId) setPrompt(`Investigate incident ${incidentId}`);
  }, [incidentId]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const investigation = await api("/investigations", {
        method: "POST",
        body: JSON.stringify({ query: prompt, incident_id: incidentId }),
      });
      setResult(investigation);
      loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return <WorkspacePage eyebrow="TOOLS · COMPANY KNOWLEDGE" title="Investigations" description="Ask about ownership, services, projects, decisions, or an incident. Answers come from connected graph records.">
    <section className="investigation-hero">
      <div className="assistant-label">GRAPH KNOWLEDGE SEARCH</div>
      <h2>What do you need to know?</h2>
      <p>Search linked people, teams, services, projects, runbooks, decisions, and incident history.</p>
      <form className="investigation-form" onSubmit={submit}>
        <textarea value={prompt} onChange={(event) => { setPrompt(event.target.value); setResult(null); }} placeholder="e.g. Who owns Checkout API, and which runbook covers it?" />
        <div><span>Results include graph relationships and source documents.</span><button disabled={busy || !prompt.trim()}>{busy ? "Searching…" : "Search company graph →"}</button></div>
      </form>
    </section>
    {error && <div className="empty-state panel">Could not search the graph: {error}</div>}
    {result && <section className="panel investigation-result">
      <div className="section-kicker">GRAPH-GROUNDED ANSWER</div>
      <h2>{result.query}</h2>
      <p className="knowledge-answer">{result.answer}</p>
      {result.tools_used?.length > 0 && <div className="tools-used"><span>TOOLS USED</span>{result.tools_used.map((tool) => <code key={tool}>{tool}</code>)}</div>}
      {result.evidence?.length > 0 && <div className="investigation-facts"><div className="section-kicker">CONNECTED FACTS</div>{result.evidence.map((fact, index) => <p key={`${fact.subject}-${fact.relationship}-${index}`}><strong>{fact.subject}</strong> {fact.relationship} <strong>{fact.object}</strong></p>)}</div>}
      {result.sources?.length > 0 && <div className="investigation-sources"><div className="section-kicker">SOURCES IN THE GRAPH</div>{result.sources.map((source) => <article key={source.id || source.title}><strong>{source.title}</strong><span>{source.kind}{source.id ? ` · ${source.id}` : ""}</span>{source.summary && <p>{source.summary}</p>}</article>)}</div>}
      {result.matches?.length > 0 && <div className="investigation-matches"><div className="section-kicker">MATCHING RECORDS</div>{result.matches.map((match) => <span key={`${match.type}-${match.id}`}>{match.type} · {match.title}</span>)}</div>}
      {!result.evidence?.length && !result.sources?.length && <p>No connected facts or source documents were found.</p>}
    </section>}
    <section className="panel history-panel">
      <div className="panel-heading"><div><div className="section-kicker">RECENT WORK</div><h2>Investigation history</h2></div></div>
      {history.length ? history.map((item) => <div className="history-row" key={item.id}>
        <span className="history-spark">↗</span><span><strong>{item.query}</strong><small>{display(item.created_at)}</small></span>
        <span className="history-status">{item.status}</span>{item.incident_id && <Link className="row-arrow" to={`/incidents/${item.incident_id}`}>↗</Link>}
      </div>) : <div className="empty-state">No investigations stored yet.</div>}
    </section>
  </WorkspacePage>;
}

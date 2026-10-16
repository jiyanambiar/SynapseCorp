import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { api, display, statusKind } from "../src/api";

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  
  useEffect(() => { 
    api("/dashboard").then(setData).catch((e) => setError(e.message)); 
  }, []);
  
  return (
    <main className="app-shell">
      <style>{`
        @media (max-width: 768px) {
          .app-shell { flex-direction: column !important; }
          .mobile-sidebar-wrapper { display: none !important; }
          .main-area { width: 100% !important; min-width: 100vw !important; padding-bottom: 2rem; }
          .metric-grid, .middle-grid, .bottom-grid { display: flex !important; flex-direction: column !important; gap: 1rem !important; }
          .content { padding: 1rem !important; }
        }
      `}</style>
      <div className="mobile-sidebar-wrapper">
        <Sidebar />
      </div>
      <section className="main-area">
        <Header />
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" />WORKSPACE OVERVIEW</div>
              <h1>System overview</h1>
              <p>Live reliability information from your FalkorDB graph.</p>
            </div>
          </div>
          {error ? (
            <div className="empty-state panel">Could not load dashboard: {error}</div>
          ) : !data ? (
            <div className="empty-state panel">Loading workspace data…</div>
          ) : (
            <>
              <section className="metric-grid">
                <article className="metric-card"><div className="metric-head"><span>Active incidents</span><span className="metric-icon pale-red">◉</span></div><div className="metric-value">{data.metrics.active_incidents}</div></article>
                <article className="metric-card"><div className="metric-head"><span>Services healthy</span><span className="metric-icon pale-green">⌘</span></div><div className="metric-value">{data.metrics.services_healthy}<span className="metric-total">/ {data.metrics.services_total}</span></div></article>
                <article className="metric-card"><div className="metric-head"><span>Customers impacted</span><span className="metric-icon pale-blue">♙</span></div><div className="metric-value">{data.metrics.customers_impacted}</div></article>
              </section>
              <section className="middle-grid">
                <article className="panel topology-panel">
                  <div className="panel-heading"><div><div className="section-kicker">LIVE SYSTEM MAP</div><h2>Service topology</h2><p>{data.topology.nodes.length} graph nodes and {data.topology.edges.length} relationships.</p></div><Link className="subtle-button" to="/topology">Explore map <span>↗</span></Link></div>
                  <div className="topology-footnote">Topology is derived directly from FalkorDB.</div>
                </article>
                <article className="panel incident-panel">
                  <div className="panel-heading incident-heading"><div><div className="section-kicker">NEEDS YOUR ATTENTION</div><h2>Active incidents <span className="count-pill">{data.incidents.length}</span></h2></div><Link className="text-link" to="/incidents">View all →</Link></div>
                  {data.incidents.slice(0, 3).map((incident) => <Link to={`/incidents/${incident.id}`} className="incident-card" key={incident.id}><div className="incident-topline"><span className="severity"><i /> {incident.severity}</span><span className="incident-time">{display(incident.created_at)}</span></div><strong>{incident.title}</strong><span className="incident-desc">{display(incident.description)}</span></Link>)}
                  {!data.incidents.length && <div className="empty-state">No active incidents.</div>}
                </article>
              </section>
              <section className="bottom-grid">
                <article className="panel services-panel">
                  <div className="panel-heading compact-heading"><div><div className="section-kicker">YOUR INFRASTRUCTURE</div><h2>Services <span className="count-pill neutral-pill">{data.services.length}</span></h2></div><Link className="text-link" to="/services">All services →</Link></div>
                  <div className="service-list">
                    {data.services.slice(0, 5).map((service) => <Link to={`/services/${service.id}`} className="service-row" key={service.id}><div className={`service-symbol ${statusKind(service.status)}`}>⌘</div><div className="service-info"><strong>{service.name}</strong><span>{display(service.region)}</span></div><span className={`service-status ${statusKind(service.status)}`}><i />{service.status}</span><span className="service-latency">{display(service.latency)}</span><span className="service-more">↗</span></Link>)}
                  </div>
                </article>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
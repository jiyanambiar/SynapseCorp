

import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header, { DateRangeButton } from "../components/Header";

const services = [
  { name: "Checkout API", meta: "Production · us-east-1", status: "Degraded", kind: "alert", icon: "◉" },
  { name: "Payments", meta: "Production · us-east-1", status: "Healthy", kind: "good", icon: "▤" },
  { name: "Order Service", meta: "Production · us-east-1", status: "Healthy", kind: "good", icon: "⌘" },
  { name: "Customer DB", meta: "Primary · us-east-1a", status: "Healthy", kind: "good", icon: "▦" },
];

function Topology({ selected, setSelected }) {
  const [zoom, setZoom] = useState(1);
  const nodes = [
    { id: "checkout", x: 50, y: 49, title: "Checkout API", sub: "DEGRADED", color: "red", icon: "◉" },
    { id: "payments", x: 28, y: 27, title: "Payments", sub: "HEALTHY", color: "green", icon: "▤" },
    { id: "orders", x: 73, y: 26, title: "Order Service", sub: "HEALTHY", color: "green", icon: "⌘" },
    { id: "redis", x: 27, y: 74, title: "Redis Cache", sub: "HEALTHY", color: "green", icon: "◌" },
    { id: "db", x: 74, y: 73, title: "Customer DB", sub: "HEALTHY", color: "green", icon: "▦" },
  ];
  const links = [[28,27,50,49],[73,26,50,49],[27,74,50,49],[74,73,50,49],[28,27,27,74],[73,26,74,73]];
  return <div className="topology">
    <div className="topology-inner" style={{ transform: `scale(${zoom})` }}>
    <svg className="connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {links.map(([x1,y1,x2,y2], i) => <line key={i} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} className={i < 4 ? "line-alert" : "line-normal"} />)}
    </svg>
    {nodes.map(node => <button key={node.id} onClick={() => setSelected(node.id)} className={`topo-node ${node.id === selected ? "chosen" : ""} ${node.color}`} style={{ left: `${node.x}%`, top: `${node.y}%` }}>
      <span className="node-icon">{node.icon}</span><span className="node-title">{node.title}</span><span className={`node-state ${node.color}`}>{node.sub}</span>
    </button>)}
    <div className="graph-caption"><span className="legend-dot red-dot" /> Degraded <span className="legend-dot green-dot" /> Healthy <span className="legend-line" /> Dependency</div>
    </div><div className="graph-controls"><button className="graph-zoom" aria-label="Zoom out" onClick={()=>setZoom(Math.max(.8,zoom-.1))}>−</button><button className="graph-zoom" aria-label="Zoom in" onClick={()=>setZoom(Math.min(1.4,zoom+.1))}>＋</button><button className="graph-zoom" aria-label="Reset zoom" onClick={()=>setZoom(1)}>⌂</button></div>
  </div>;
}

export default function Home() {
  const [selected, setSelected] = useState("checkout");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return <main className="app-shell"><Sidebar/><section className="main-area">
      <Header/>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THURSDAY, OCTOBER 15, 2026</div><h1>Good morning, Jordan</h1><p>Here’s what’s happening across your systems today.</p></div><DateRangeButton/></div>

        <section className="metric-grid">
          <article className="metric-card"><div className="metric-head"><span>Active incidents</span><span className="metric-icon pale-red">◉</span></div><div className="metric-value">03 <span className="metric-change red-text">+1 today</span></div><div className="metric-foot"><span className="mini-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/></span><span>vs. 2 yesterday</span></div></article>
          <article className="metric-card"><div className="metric-head"><span>Services healthy</span><span className="metric-icon pale-green">⌘</span></div><div className="metric-value">24<span className="metric-total">/ 26</span><span className="metric-change green-text">92.3%</span></div><div className="metric-foot"><span className="progress-line"><i /></span><span>2 need attention</span></div></article>
          <article className="metric-card"><div className="metric-head"><span>Mean time to resolve</span><span className="metric-icon pale-gold">◷</span></div><div className="metric-value">18<span className="metric-unit"> min</span><span className="metric-change green-text">↓ 12%</span></div><div className="metric-foot"><span>Compared to last week</span></div></article>
          <article className="metric-card"><div className="metric-head"><span>Customers impacted</span><span className="metric-icon pale-blue">♙</span></div><div className="metric-value">1,284<span className="metric-change red-text">+8.4%</span></div><div className="metric-foot"><span className="tiny-avatar-stack"><i>R</i><i>M</i><i>A</i></span><span>across 3 incidents</span></div></article>
        </section>

        <section className="middle-grid">
          <article className="panel topology-panel"><div className="panel-heading"><div><div className="section-kicker">LIVE SYSTEM MAP</div><h2>Service topology</h2><p>See how your services connect and affect one another.</p></div><Link className="subtle-button" to="/topology">Explore map <span>↗</span></Link></div><Topology selected={selected} setSelected={setSelected}/></article>
          <article className="panel incident-panel"><div className="panel-heading incident-heading"><div><div className="section-kicker">NEEDS YOUR ATTENTION</div><h2>Active incidents <span className="count-pill">3</span></h2></div><Link className="text-link" to="/incidents">View all <span>→</span></Link></div>
            <Link to="/incidents/checkout-latency" className="incident-card selected-incident"><div className="incident-topline"><span className="severity"><i/> SEV 1</span><span className="incident-time">12 min ago</span></div><strong>Checkout API latency spike</strong><span className="incident-desc">p95 latency above 2.5s · us-east-1</span><div className="incident-bottom"><span className="owner-avatar">SC</span><span>Sarah Chen</span><span className="incident-separator">·</span><span>1,284 impacted</span><span className="incident-arrow">↗</span></div></Link>
            <Link to="/incidents/queue-backlog" className="incident-card"><div className="incident-topline"><span className="severity sev-2"><i/> SEV 2</span><span className="incident-time">38 min ago</span></div><strong>Queue backlog growing</strong><span className="incident-desc">worker queue depth over 10k · eu-west-1</span><div className="incident-bottom"><span className="owner-avatar avatar-gold">AL</span><span>Alex Lee</span><span className="incident-separator">·</span><span>426 impacted</span><span className="incident-arrow">↗</span></div></Link>
            <Link to="/incidents/webhook-delays" className="incident-card last-incident"><div className="incident-topline"><span className="severity sev-3"><i/> SEV 3</span><span className="incident-time">2 hrs ago</span></div><strong>Webhook delivery delays</strong><span className="incident-desc">delivery time above 30s · global</span><div className="incident-bottom"><span className="owner-avatar avatar-blue">MK</span><span>Morgan Kim</span><span className="incident-separator">·</span><span>92 impacted</span><span className="incident-arrow">↗</span></div></Link>
          </article>
        </section>

        <section className="bottom-grid"><article className="panel services-panel"><div className="panel-heading compact-heading"><div><div className="section-kicker">YOUR INFRASTRUCTURE</div><h2>Services <span className="count-pill neutral-pill">26</span></h2></div><Link className="text-link" to="/services">All services <span>→</span></Link></div><div className="service-list">{services.map(service=><Link to={`/services/${encodeURIComponent(service.name.toLowerCase().replaceAll(" ","-"))}`} className="service-row" key={service.name}><div className={`service-symbol ${service.kind}`}>{service.icon}</div><div className="service-info"><strong>{service.name}</strong><span>{service.meta}</span></div><span className={`service-status ${service.kind}`}><i/>{service.status}</span><span className="service-latency">{service.kind === "alert" ? "2.84s" : "42ms"}</span><span className="service-more">↗</span></Link>)}</div></article>
          <article className="assistant-card"><div className="assistant-content"><div className="assistant-label">QUICK INVESTIGATION</div><h2>Ask about an incident</h2><p>Trace a slowdown, check a dependency, or find the service owner.</p><form className="ask-form" onSubmit={e=>{e.preventDefault(); if(query.trim()) setSubmitted(true)}}><input value={query} onChange={e=>{setQuery(e.target.value);setSubmitted(false)}} placeholder="Why is checkout slow?" aria-label="Search system data"/><button type="submit" aria-label="Start investigation">→</button></form>{submitted&&<div className="answer-hint">Investigation started for “{query}”</div>}<div className="suggestions"><button onClick={()=>setQuery("What changed in the last hour?")}>What changed recently? <span>↗</span></button><button onClick={()=>setQuery("Who owns Checkout API?")}>Who owns Checkout API? <span>↗</span></button></div></div></article></section>
        <footer className="page-footer"><span>Synapse helps your team understand the whole picture.</span><span>Updated just now <i/></span></footer>
      </div>
    </section>
  </main>;
}

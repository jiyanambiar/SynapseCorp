import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import WorkspacePage from "../../components/WorkspacePage";
import { api, display, statusKind } from "../../src/api";

export default function ServicesPage() {
  const [services, setServices] = useState([]); const [filter, setFilter] = useState("All services");
  const [term, setTerm] = useState(""); const [error, setError] = useState("");
  useEffect(() => { api("/services").then(setServices).catch((e) => setError(e.message)); }, []);
  const rows = useMemo(() => services.filter((service) => (filter === "All services" || service.status === filter) && `${service.name} ${service.team || ""}`.toLowerCase().includes(term.toLowerCase())), [filter, term, services]);
  const filters = ["All services", ...Array.from(new Set(services.map((service) => service.status)))];
  return <WorkspacePage eyebrow="WORKSPACE · INFRASTRUCTURE" title="Services" description="Monitor service health, ownership, and dependencies.">
    <section className="panel data-panel"><div className="toolbar"><div className="filter-tabs">{filters.map((item) => <button key={item} className={filter === item ? "filter-active" : ""} onClick={() => setFilter(item)}>{item}<span>{item === "All services" ? services.length : services.filter((service) => service.status === item).length}</span></button>)}</div><label className="table-search">⌕ <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search services" /></label></div>
      {error ? <div className="empty-state">Could not load services: {error}</div> : <div className="table-wrap"><table><thead><tr><th>SERVICE</th><th>HEALTH</th><th>LATENCY</th><th>30D UPTIME</th><th>OWNER</th><th>DEPENDENCIES</th></tr></thead><tbody>{rows.map((service) => <tr key={service.id}><td><Link to={`/services/${service.id}`} className="table-title"><span className={`service-symbol ${statusKind(service.status)}`}>⌘</span><span><strong>{service.name}</strong><small>{display(service.region)}</small></span></Link></td><td><span className={`service-status ${statusKind(service.status)}`}><i />{service.status}</span></td><td>{display(service.latency)}</td><td>{display(service.uptime)}</td><td>{display(service.team)}</td><td>{service.dependencies} services <Link className="row-arrow" to="/topology">↗</Link></td></tr>)}</tbody></table>{!rows.length && <div className="empty-state">No services found.</div>}</div>}
      <div className="table-footer">Showing {rows.length} of {services.length} services <span>Live data from FalkorDB.</span></div></section>
  </WorkspacePage>;
}

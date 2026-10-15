import { useEffect, useMemo, useState } from "react";
import WorkspacePage from "../../components/WorkspacePage";
import { api, display } from "../../src/api";

const normaliseReport = (value) => ({
  incidents_total: Number(value?.incidents_total) || 0,
  services_total: Number(value?.services_total) || 0,
  average_uptime: value?.average_uptime !== null && value?.average_uptime !== undefined && Number.isFinite(Number(value.average_uptime)) ? Number(value.average_uptime) : null,
  by_severity: Array.isArray(value?.by_severity) ? value.by_severity.filter((item) => item && typeof item === "object") : [],
  incidents: Array.isArray(value?.incidents) ? value.incidents.filter((item) => item && typeof item === "object") : [],
});

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/reports").then((response) => { if (active) setReport(normaliseReport(response)); }).catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  const highestSeverityCount = useMemo(() => Math.max(1, ...(report?.by_severity || []).map((item) => Math.max(0, Number(item.count) || 0))), [report]);
  function exportCsv() {
    if (!report) return;
    const lines = ["Severity,Incident count", ...report.by_severity.map((row) => `${row.severity || "Unknown"},${Number(row.count) || 0}`)];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    link.download = "synapse-reliability-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (error) return <WorkspacePage eyebrow="TOOLS · RELIABILITY INSIGHTS" title="Reports" description={error} />;
  if (!report) return <WorkspacePage eyebrow="TOOLS · RELIABILITY INSIGHTS" title="Reports" description="Loading reporting data from FalkorDB." />;

  const metrics = [["Incidents", report.incidents_total], ["Services", report.services_total], ["Average uptime", report.average_uptime === null ? "—" : `${report.average_uptime.toFixed(2)}%`]];
  return <WorkspacePage eyebrow="TOOLS · RELIABILITY INSIGHTS" title="Reports" description="A graph-derived view of reliability data." action={<button className="primary-button" onClick={exportCsv}>↓ &nbsp; Export CSV</button>}>
    <section className="report-kpis">{metrics.map(([label, value]) => <article className="panel report-kpi" key={label}><span>{label}</span><strong>{value}</strong><small>Current FalkorDB data</small></article>)}</section>
    <div className="reports-grid"><section className="panel report-chart-panel"><div className="panel-heading"><div><div className="section-kicker">INCIDENT DISTRIBUTION</div><h2>Incidents by severity</h2></div></div><div className="report-chart"><div className="report-bars">{report.by_severity.map((item, index) => { const count = Math.max(0, Number(item.count) || 0); const height = Math.max(8, Math.min(100, (count / highestSeverityCount) * 100)); return <div className="bar-pair" key={`${item.severity || "unknown"}-${index}`}><i style={{ height: `${height}%` }} /><span>{item.severity || "Unknown"}<br />{count}</span></div>; })}</div></div>{!report.by_severity.length && <div className="empty-state">No incident records available.</div>}</section><section className="panel report-summary"><div className="section-kicker">INCIDENT RECORDS</div><h2>Latest incidents</h2>{report.incidents.length ? report.incidents.slice(0, 5).map((item, index) => <div className="resolution-row" key={item.id || `${item.title}-${item.created_at}-${index}`}><div><strong>{display(item.title, "Untitled incident")}</strong><span>{display(item.severity)}</span></div><span>{display(item.status)}</span></div>) : <div className="empty-state">No incident records available.</div>}</section></div>
  </WorkspacePage>;
}

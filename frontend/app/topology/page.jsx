import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import WorkspacePage from "../../components/WorkspacePage";
import { api, display, statusKind } from "../../src/api";

export default function TopologyPage() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(0.5);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/graph/topology")
      .then((data) => {
        setGraph(data);
        setSelected(data.nodes.find((node) => node.labels.includes("Service"))?.id || data.nodes[0]?.id);
      })
      .catch((e) => setError(e.message));
  }, []);

  const X_SPACING = 320; 
  const Y_SPACING = 150; 

  const totalNodes = graph.nodes.length;
  const cols = totalNodes > 0 ? Math.ceil(Math.sqrt(totalNodes)) : 1;
  const rows = totalNodes > 0 ? Math.ceil(totalNodes / cols) : 1;

  const canvasWidth = cols * X_SPACING + 200;
  const canvasHeight = rows * Y_SPACING + 200;

  const nodes = useMemo(() => {
    if (totalNodes === 0) return [];
    
    return graph.nodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = col * X_SPACING + 150;
      const y = row * Y_SPACING + 100;

      return {
        ...node,
        title: node.props.name || node.props.id || node.labels[0] || "Graph node",
        serviceId: node.props.id || String(node.props.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        x,
        y
      };
    });
  }, [graph.nodes, cols, totalNodes]);

  const node = nodes.find((item) => item.id === selected);
  const positions = Object.fromEntries(nodes.map((item) => [item.id, item]));

  return (
    <WorkspacePage
      eyebrow="WORKSPACE · SYSTEM MAP"
      title="Service topology"
      description="Explore the relationships stored in your production graph."
      action={
        <button className="outline-button" onClick={() => setZoom(0.5)}>
          ⟳ &nbsp; Reset view
        </button>
      }
    >
      {error ? (
        <div className="empty-state panel">Could not load topology: {error}</div>
      ) : (
        <div className="topology-page-grid">
          <section className="panel topology-large-panel">
            <div className="topology-toolbar">
              <div className="graph-legend">
                <span><i className="red-dot" />Needs attention</span>
                <span><i className="green-dot" />Operational</span>
                <span><i className="legend-line" />Graph relationship</span>
              </div>
              <div className="zoom-controls">
                <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>−</button>
                <span>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}>＋</button>
              </div>
            </div>
            
            <div className="topology topology-expanded" style={{ overflow: "auto", height: "75vh" }}>
              <div 
                className="topology-inner" 
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: "top left",
                  width: `${canvasWidth}px`, 
                  height: `${canvasHeight}px`,
                  position: "relative"
                }}
              >
                <svg className="connections" width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
                  {graph.edges.map((edge, index) => {
                    const source = positions[edge.source];
                    const target = positions[edge.target];
                    if (!source || !target) return null;
                    return (
                      <line
                        key={`${edge.source}-${edge.target}-${index}`}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        className="line-normal"
                      />
                    );
                  })}
                </svg>
                
                {nodes.map((item) => (
                  <button
                    key={item.id}
                    className={`topo-node ${statusKind(item.props.status) === "good" ? "green" : "red"} ${selected === item.id ? "chosen" : ""}`}
                    style={{ left: `${item.x}px`, top: `${item.y}px`, position: "absolute" }}
                    onClick={() => setSelected(item.id)}
                  >
                    <span className="node-icon">⌘</span>
                    <span className="node-title">{item.title}</span>
                    <span className={`node-state ${statusKind(item.props.status) === "good" ? "green" : "red"}`}>
                      {display(item.props.status, item.labels.join(", ")).toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
          
          <aside className="panel selected-node-panel" style={{ height: "75vh", overflow: "auto" }}>
            {node ? (
              <>
                <div className="section-kicker">SELECTED NODE</div>
                <div className="selected-service-title">
                  <span className={`service-symbol ${statusKind(node.props.status)}`}>⌘</span>
                  <h2>{node.title}</h2>
                </div>
                <span className={`service-status ${statusKind(node.props.status)}`}>
                  <i />
                  {display(node.props.status, node.labels.join(", "))}
                </span>
                <p>{display(node.props.description, "No description stored for this graph node.")}</p>
                
                <div className="side-divider" />
                <div className="section-kicker">CONNECTED NODES</div>
                <ul className="connected-list">
                  {graph.edges
                    .filter((edge) => edge.source === node.id || edge.target === node.id)
                    .map((edge, index) => {
                      const related = positions[edge.source === node.id ? edge.target : edge.source];
                      if (!related) return null;
                      return (
                        <li key={`${edge.type}-${index}`}>
                          <i className={statusKind(related.props.status)} />
                          <button onClick={() => setSelected(related.id)}>{related.title}</button>
                          <span>{edge.type}</span>
                        </li>
                      );
                    })}
                </ul>
                
                {node.labels.includes("Service") && (
                  <Link className="primary-button full-button link-button" to={`/services/${node.serviceId}`}>
                    Open service details →
                  </Link>
                )}
              </>
            ) : (
              <p>Select a graph node.</p>
            )}
          </aside>
        </div>
      )}
    </WorkspacePage>
  );
}
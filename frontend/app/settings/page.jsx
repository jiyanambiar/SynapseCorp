import { useEffect, useState } from "react";
import WorkspacePage from "../../components/WorkspacePage";
import { api } from "../../src/api";

export default function SettingsPage() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [saved, setSaved] = useState(false); const [error, setError] = useState("");
  useEffect(() => { api("/workspace").then((workspace) => { setName(workspace.name || ""); setEmail(workspace.email || ""); }).catch((e) => setError(e.message)); }, []);
  async function save() { try { await api("/workspace", { method: "PATCH", body: JSON.stringify({ name, email }) }); setSaved(true); } catch (e) { setError(e.message); } }
  return <WorkspacePage eyebrow="WORKSPACE · PREFERENCES" title="Settings" description="Workspace preferences are stored in FalkorDB."><div className="settings-grid"><section className="panel settings-card"><div className="section-kicker">WORKSPACE PROFILE</div><h2>Workspace details</h2><label className="settings-field">Workspace name<input value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} /></label><label className="settings-field">Contact email<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setSaved(false); }} /></label><button className="primary-button" onClick={save}>Save changes</button>{saved && <span className="saved-note">✓ Saved to FalkorDB</span>}{error && <p>{error}</p>}</section><section className="panel settings-card"><div className="section-kicker">CONNECTED DATA</div><h2>Backend connection</h2><p>The frontend uses the configured FastAPI API and all workspace data is retrieved from FalkorDB.</p><label className="settings-field">API base URL<input readOnly value={import.meta.env.VITE_API_URL || "http://localhost:8000"} /></label></section></div></WorkspacePage>;
}

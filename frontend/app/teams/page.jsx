import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import WorkspacePage from "../../components/WorkspacePage";
import { api, display, initials } from "../../src/api";

const normaliseTeam = (team) => ({
  ...team,
  members: Array.isArray(team?.members) ? team.members : [],
  services: Array.isArray(team?.services) ? team.services : [],
  open_incidents: Number.isFinite(Number(team?.open_incidents)) ? Number(team.open_incidents) : 0,
});

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const response = await api("/teams");
      setTeams(Array.isArray(response) ? response.map(normaliseTeam) : []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  // The effect itself must not return the Promise from load(); React treats a
  // returned value as an effect cleanup function, which was the blank-screen bug.
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => teams.filter((team) => (team.name || "").toLowerCase().includes(query.toLowerCase())), [teams, query]);

  async function createTeam(event) {
    event.preventDefault();
    try {
      await api("/teams", { method: "POST", body: JSON.stringify({ name: teamName.trim() }) });
      setTeamName("");
      setCreating(false);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return <WorkspacePage eyebrow="WORKSPACE · PEOPLE" title="Teams" description="Know who owns each service and who is on call.">
    <div className="team-toolbar"><label className="table-search">⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a team" /></label><button className="primary-button" onClick={() => setCreating(true)}>＋ &nbsp; Add team</button></div>
    {error ? <div className="empty-state panel">Could not load teams: {error}</div> : <div className="team-grid">{filtered.map((team) => <article className={`panel team-card ${expanded === team.id ? "team-selected" : ""}`} key={team.id}><div className="team-card-head"><span className="team-avatar">{initials(team.name)}</span></div><h2>{display(team.name, "Unnamed team")}</h2><p>{team.members.length} members · {team.services.length} services</p><div className="team-card-section"><small>ON CALL NOW</small><span className="table-owner"><i>{initials(team.on_call)}</i>{display(team.on_call, "Not set")}</span></div><div className="team-card-section"><small>OWNED SERVICES</small><div className="team-service-chips">{team.services.length ? team.services.map((service) => <Link to={`/services/${service.id}`} key={service.id}>{display(service.name)}</Link>) : <span className="muted-chip">No services stored</span>}</div></div>{expanded === team.id && <div className="team-members-expanded">{team.members.map((member) => <span key={member}><i>{initials(member)}</i>{member}</span>)}</div>}<div className="team-card-foot"><span>{team.open_incidents} open incidents</span><button onClick={() => setExpanded(expanded === team.id ? null : team.id)}>{expanded === team.id ? "Hide members" : "View members →"}</button></div></article>)}</div>}
    {!error && !filtered.length && <div className="empty-state panel">No teams match that name.</div>}
    {creating && <div className="search-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreating(false); }}><form className="create-dialog" onSubmit={createTeam}><div className="section-kicker">NEW TEAM</div><h2>Create a team</h2><label>Team name<input autoFocus value={teamName} onChange={(event) => setTeamName(event.target.value)} /></label><div className="dialog-actions"><button type="button" className="outline-button" onClick={() => setCreating(false)}>Cancel</button><button className="primary-button" disabled={!teamName.trim()}>Create team</button></div></form></div>}
  </WorkspacePage>;
}

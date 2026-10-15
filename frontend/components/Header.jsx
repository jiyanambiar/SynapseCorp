

import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const results = [["Overview", "/", "Workspace dashboard"], ["Incidents", "/incidents", "Active and resolved incidents"], ["Services", "/services", "Health and service owners"], ["Topology", "/topology", "Connected system map"], ["Teams", "/teams", "On-call and service teams"], ["Investigations", "/investigations", "Investigation workspace"], ["Reports", "/reports", "Reliability reports"]];

export default function Header() {
  const pathname = useLocation().pathname;
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [noticeRead, setNoticeRead] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const filtered = results.filter(([name, , desc]) => `${name} ${desc}`.toLowerCase().includes(search.toLowerCase()));
  const section = pathname === "/" ? "Overview" : pathname.split("/")[1].replaceAll("-", " ").replace(/\b\w/g, c=>c.toUpperCase());
  return <><header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>{section}</strong></div><div className="top-actions"><div className="system-status"><span className="status-pulse"/> All systems operational</div><button className="icon-button" aria-label="Search" onClick={()=>setSearchOpen(true)}>âŒ•</button><button className="icon-button notification" aria-label="Notifications" onClick={()=>setNotifications(!notifications)}>â™§{!noticeRead&&<i/>}</button><button className="top-avatar" onClick={()=>setProfileOpen(!profileOpen)} aria-label="Open profile">JM</button></div>
    {notifications&&<div className="floating-menu notification-menu"><div className="floating-title">Notifications <button onClick={()=>setNoticeRead(true)}>Mark all read</button></div>{noticeRead?<p>Youâ€™re all caught up.</p>:<Link to="/incidents" onClick={()=>setNotifications(false)}><span className="notice-dot"/>Checkout API latency spike<span className="notice-time">12 min ago</span></Link>}<Link to="/incidents" onClick={()=>setNotifications(false)}>See all incidents â†’</Link></div>}
    {profileOpen&&<div className="floating-menu top-profile-menu"><strong>Jordan Miller</strong><span>Platform engineer</span><Link to="/settings" onClick={()=>setProfileOpen(false)}>Profile and workspace settings</Link></div>}
  </header>
  {searchOpen&&<div className="search-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)setSearchOpen(false)}}><div className="search-dialog"><div className="search-input-wrap"><span>âŒ•</span><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pages and workspaceâ€¦" onKeyDown={e=>{if(e.key==="Escape")setSearchOpen(false)}}/><kbd>ESC</kbd></div><div className="search-results">{filtered.length?filtered.map(([name,href,desc])=><Link to={href} key={href} onClick={()=>setSearchOpen(false)}><span className="search-result-icon">âŒ˜</span><span><strong>{name}</strong><small>{desc}</small></span><span className="search-enter">â†µ</span></Link>):<p>No matching pages found.</p>}</div><div className="search-foot">Navigate to a workspace page</div></div></div>}
  </>;
}

export function DateRangeButton() {
  const [range, setRange] = useState("Last 24 hours");
  const [open, setOpen] = useState(false);
  return <div className="range-wrap"><button className="date-button" onClick={()=>setOpen(!open)}>â—· &nbsp; {range} <span>âŒ„</span></button>{open&&<div className="range-menu">{["Last 24 hours","Last 7 days","Last 30 days"].map(value=><button key={value} className={range===value?"selected-range":""} onClick={()=>{setRange(value);setOpen(false)}}>{value}{range===value&&<span>âœ“</span>}</button>)}</div>}</div>;
}


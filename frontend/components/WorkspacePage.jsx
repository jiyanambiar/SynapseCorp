import Sidebar from "./Sidebar";
import Header from "./Header";

export default function WorkspacePage({ eyebrow = "WORKSPACE", title, description, action, children }) {
  return <main className="app-shell"><Sidebar/><section className="main-area"><Header/><div className="content"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>{children}<footer className="page-footer"><span>Synapse helps your team understand the whole picture.</span><span>Updated just now <i/></span></footer></div></section></main>;
}

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "../app/globals.css";

import Home from "../app/page.jsx";
import IncidentsPage from "../app/incidents/page.jsx";
import IncidentDetail from "../app/incidents/[id]/page.jsx";
import ServicesPage from "../app/services/page.jsx";
import ServiceDetail from "../app/services/[id]/page.jsx";
import TopologyPage from "../app/topology/page.jsx";
import TeamsPage from "../app/teams/page.jsx";
import InvestigationsPage from "../app/investigations/page.jsx";
import ReportsPage from "../app/reports/page.jsx";
import SettingsPage from "../app/settings/page.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/topology" element={<TopologyPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/investigations" element={<InvestigationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

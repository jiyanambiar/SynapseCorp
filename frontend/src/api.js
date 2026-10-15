const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { message = (await response.json()).detail || message; } catch { /* use status */ }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}

export function initials(value) {
  return (value || "?").split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

export function statusKind(value) {
  return ["healthy", "operational", "resolved", "closed"].includes((value || "").toLowerCase()) ? "good" : "alert";
}

export function display(value, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

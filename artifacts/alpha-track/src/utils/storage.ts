import { Project, STORAGE_KEY, computeQuickScore } from "../types";

export function migrateProjects(projects: Project[]): Project[] {
  let changed = false;
  const migrated = projects.map((p) => {
    const updates: Partial<Project> = {};
    if (!("verdict" in p)) { updates.verdict = null; }
    if (!("scoreNarrative" in p)) { updates.scoreNarrative = null; }
    if (!("scoreBuilder" in p)) { updates.scoreBuilder = null; }
    if (!("scoreCT" in p)) { updates.scoreCT = null; }
    if (!("scoreTiming" in p)) { updates.scoreTiming = null; }
    if (!("scoreExecution" in p)) { updates.scoreExecution = null; }
    if (!("ctCount" in p)) { updates.ctCount = null; }
    if (!("timingWindow" in p)) { updates.timingWindow = null; }
    if (!("reasonToDrop" in p)) { updates.reasonToDrop = ""; }
    if (!("biaCheck" in p)) { updates.biaCheck = ""; }
    if (Object.keys(updates).length > 0) {
      changed = true;
      return { ...p, ...updates };
    }
    return p;
  });
  if (changed) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    } catch {}
  }
  return migrated;
}

export function getProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    return migrateProjects(parsed);
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function addProject(project: Project): void {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
}

export function updateProject(updated: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === updated.id);
  if (idx !== -1) {
    projects[idx] = updated;
    saveProjects(projects);
  }
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}.${mins}`;
}

export { computeQuickScore };

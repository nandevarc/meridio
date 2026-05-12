import type { Project } from '../types/project';

const STORAGE_KEY = 'alphatrack_projects';
const SCHEMA_VERSION = '2';
const SCHEMA_VERSION_KEY = 'alphatrack_schema_version';

export function getAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

export function saveAllProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProjectById(id: string): Project | null {
  return getAllProjects().find(p => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const all = getAllProjects();
  const idx = all.findIndex(p => p.id === project.id);
  const updated = { ...project, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.push(updated);
  }
  saveAllProjects(all);
}

export function deleteProject(id: string): void {
  const all = getAllProjects().filter(p => p.id !== id);
  saveAllProjects(all);
}

export function markAsReviewed(id: string): void {
  const all = getAllProjects();
  const idx = all.findIndex(p => p.id === id);
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      lastReviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveAllProjects(all);
  }
}

export function getSchemaVersion(): string {
  return localStorage.getItem(SCHEMA_VERSION_KEY) ?? '1';
}

export function setSchemaVersion(): void {
  localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
}

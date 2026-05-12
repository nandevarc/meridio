// Thin adapter — canonical implementation lives in src/lib/storage.ts
import {
  getAllProjects, saveAllProjects, getProjectById,
  saveProject, deleteProject as libDeleteProject,
} from '../lib/storage';
import type { Project } from '../types/project';
import { computeQuickScore } from '../types';

export { computeQuickScore };

export function getProjects(): Project[] {
  return getAllProjects();
}

export function saveProjects(projects: Project[]): void {
  saveAllProjects(projects);
}

export function addProject(project: Project): void {
  saveProject(project);
}

export function updateProject(updated: Project): void {
  saveProject(updated);
}

export function deleteProject(id: string): void {
  libDeleteProject(id);
}

export function getProject(id: string): Project | undefined {
  return getProjectById(id) ?? undefined;
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
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins  = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}.${mins}`;
}

import { getAllProjects } from './storage';
import type { Project } from '../types/project';

export interface DuplicateResult {
  matchedProject: Project;
  matchType: 'exact' | 'fuzzy';
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function nameSimilar(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
}

function chainsOverlap(a: string[], b: string[]): boolean {
  const na = a.map(normalize);
  const nb = b.map(normalize);
  return na.some((c) => nb.includes(c));
}

export function checkDuplicate(
  name: string,
  chains: string[],
  excludeId?: string
): DuplicateResult | null {
  if (!name.trim() || chains.length === 0) return null;
  const projects = getAllProjects();
  for (const p of projects) {
    if (excludeId && p.id === excludeId) continue;
    if (nameSimilar(name, p.name) && chainsOverlap(chains, p.chain)) {
      return {
        matchedProject: p,
        matchType: normalize(name) === normalize(p.name) ? 'exact' : 'fuzzy',
      };
    }
  }
  return null;
}

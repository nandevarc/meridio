import type { Project } from '../types/project';
import { createEmptyProject } from './projectFactory';

// ─── FORMAT A: INTERNAL BACKUP ─────────────────────────────────────

export interface BackupPayload {
  version:      string;
  exportedAt:   string;
  projectCount: number;
  count:        number;
  projects:     Project[];
}

export interface ValidationResult {
  valid:       boolean;
  error?:      string;
  count?:      number;
  exportedAt?: string | null;
  version?:    string;
  projects?:   Project[];
}

export function validateBackupFile(parsed: unknown): ValidationResult {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'File tidak valid: bukan format JSON yang benar.' };
  }
  const data = parsed as Record<string, unknown>;
  if (!Array.isArray(data.projects)) {
    return { valid: false, error: 'File tidak valid: tidak ditemukan data projects.' };
  }
  if ((data.projects as unknown[]).length === 0) {
    return { valid: false, error: 'File backup kosong: tidak ada project yang bisa direstore.' };
  }
  return {
    valid:      true,
    count:      (data.projects as unknown[]).length,
    exportedAt: (data.exportedAt as string) ?? null,
    version:    (data.version as string) ?? null,
    projects:   data.projects as Project[],
  };
}

export function exportBackup(projects: Project[]): void {
  const today   = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const payload: BackupPayload = {
    version:      '2',
    exportedAt:   today.toISOString(),
    projectCount: projects.length,
    count:        projects.length,
    projects,
  };
  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = `alphatrack-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(
  file: File,
  onSuccess: (projects: Project[]) => void,
  onError: (msg: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string);
      const result = validateBackupFile(parsed);
      if (!result.valid || !result.projects) {
        onError(result.error ?? 'Invalid backup file.');
        return;
      }
      onSuccess(result.projects);
    } catch {
      onError('Failed to parse backup file.');
    }
  };
  reader.readAsText(file);
}

// ─── FORMAT B: AI IMPORT FORMAT ────────────────────────────────────

export interface AIImportFormat {
  name:          string;
  chain:         string[];
  category:      string[];
  stage:         string[];
  website?:      string;
  twitter?:      string;
  description?:  string;
  narrative?:    string;
  builders?:     string[];
  ctNames?:      string[];
  ctCount?:      number;
  scores?: {
    narrative?:  number;
    builder?:    number;
    ctSignal?:   number;
    timing?:     number;
    execution?:  number;
  };
  verdict?:        string;
  timingWindow?:   string;
  playType?:       string[];
  actionRequired?: string;
  source?:         string;
}

export function fromAIImport(data: AIImportFormat): Project {
  const base = createEmptyProject();
  return {
    ...base,
    name:        data.name,
    chain:       data.chain       ?? [],
    category:    data.category    ?? [],
    stage:       data.stage       ?? [],
    source:      data.source      ?? '',
    links: {
      ...base.links,
      website: data.website ?? '',
      twitter: data.twitter ?? '',
    },
    description: data.description ?? '',
    narrative:   data.narrative   ?? '',
    builders:    data.builders    ?? [],
    ct: {
      names: data.ctNames ?? [],
      count: data.ctCount ?? 0,
    },
    scores: {
      narrative:  data.scores?.narrative  ?? 0,
      builder:    data.scores?.builder    ?? 0,
      ctSignal:   data.scores?.ctSignal   ?? 0,
      timing:     data.scores?.timing     ?? 0,
      execution:  data.scores?.execution  ?? 0,
    },
    playType:       data.playType       ?? [],
    actionRequired: data.actionRequired ?? '',
    verdict:        (data.verdict      as Project['verdict'])      ?? null,
    timingWindow:   (data.timingWindow as Project['timingWindow']) ?? null,
  };
}

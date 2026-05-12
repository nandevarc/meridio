// Re-export everything from the canonical schema
export type {
  Conviction, PlayStatus, ProjectStatus, Priority,
  Verdict, TimingWindow,
  ProjectLinks, ProjectCT, ProjectScores, Project,
} from './types/project';
export { computeTotal } from './types/project';

import type { PlayStatus, Verdict, TimingWindow, ProjectScores, ProjectStatus, Priority, Project } from './types/project';
import { computeTotal } from './types/project';

// Legacy key — kept for schema-wipe reference in main.tsx
export const STORAGE_KEY = "alphatrack_v2";

export const STATUS_ORDER: ProjectStatus[] = ["Screening", "Watchlist", "Active Play", "Done", "Skip"];

export const STATUS_STYLES: Record<ProjectStatus, { text: string; bg: string; border: string }> = {
  Screening:     { text: "#6B7280", bg: "#F5F5F5",  border: "#E5E7EB" },
  Watchlist:     { text: "#2563EB", bg: "#EFF6FF",  border: "#BFDBFE" },
  "Active Play": { text: "#059669", bg: "#ECFDF5",  border: "#A7F3D0" },
  Skip:          { text: "#DC2626", bg: "#FEF2F2",  border: "#FECACA" },
  Done:          { text: "#7C3AED", bg: "#F5F3FF",  border: "#DDD6FE" },
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  High:   "#DC2626",
  Medium: "#D97706",
  Low:    "#9CA3AF",
};

export const PLAY_STATUS_COLORS: Record<PlayStatus, string> = {
  "Belum Ada": "#9CA3AF",
  Aktif:       "#4B7C6F",
  Selesai:     "#2563EB",
  Skip:        "#DC2626",
};

export const PLAY_TYPES = [
  "Testnet", "Early Mint", "NFTs", "Whitelist", "Social",
  "Degen", "Retro", "Role", "Grinding", "Node", "Campaign", "Mining", "Gaming"
];

export const VERDICT_STYLES: Record<Verdict, { text: string; bg: string; border: string }> = {
  "Strong Play": { text: "#4B7C6F", bg: "#EBF4F1", border: "#A7D9CE" },
  Watch:         { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  Ignore:        { text: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB" },
};

export const TIMING_STYLES: Record<TimingWindow, { text: string; bg: string; border: string }> = {
  Now:         { text: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  "This Week": { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  Monitor:     { text: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  "No Rush":   { text: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB" },
};

export const SCORE_LABELS: Array<{ key: keyof ProjectScores; label: string }> = [
  { key: "narrative",  label: "Narrative Fit"  },
  { key: "builder",    label: "Team / Builder"  },
  { key: "ctSignal",   label: "CT Signal"       },
  { key: "timing",     label: "Timing"          },
  { key: "execution",  label: "Execution Risk"  },
];

/** Returns null when all scores are 0 (unscored), otherwise returns total. */
export function computeQuickScore(scores: ProjectScores): number | null {
  const total = computeTotal(scores);
  return total > 0 ? total : null;
}

export function scoreColor(score: number): string {
  if (score >= 18) return "#4B7C6F";
  if (score >= 10) return "#D97706";
  return "#DC2626";
}

// Kept for backward compat — pages still import computeQuickScore from ../types
export type { ProjectScores as ScoreShape };

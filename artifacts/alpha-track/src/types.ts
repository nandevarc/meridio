export type ProjectStatus = "Screening" | "Watchlist" | "Active Play" | "Done" | "Skip";
export type Priority = "Low" | "Medium" | "High";
export type PlayStatus = "Belum Ada" | "Segera" | "Aktif" | "Selesai";
export type Conviction = "Low" | "Medium" | "High";
export type Verdict = "Strong Play" | "Watch" | "Ignore" | null;
export type TimingWindow = "Now" | "This Week" | "Monitor" | "No Rush" | null;

export interface Project {
  id: string;
  name: string;
  category: string[];
  chain: string[];
  stage: string[];
  findDate: string;
  website: string;
  twitter: string;
  discord: string;
  telegram: string;
  github: string;
  description: string;
  narrative: string;
  builder: string;
  ctSignal: string;
  conviction: Conviction;
  decisionNote: string;
  quickScore: number | null;
  source: string;
  playTypes: string[];
  playStatus: PlayStatus;
  actionRequired: string;
  playNotes: string;
  status: ProjectStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  // New fields
  verdict: Verdict;
  scoreNarrative: number | null;
  scoreBuilder: number | null;
  scoreCT: number | null;
  scoreTiming: number | null;
  scoreExecution: number | null;
  ctCount: number | null;
  timingWindow: TimingWindow;
  reasonToDrop: string;
  biaCheck: string;
}

export const STORAGE_KEY = "alphatrack_v2";

export const STATUS_ORDER: ProjectStatus[] = ["Screening", "Watchlist", "Active Play", "Done", "Skip"];

export const STATUS_STYLES: Record<ProjectStatus, { text: string; bg: string; border: string }> = {
  Screening: { text: "#888888", bg: "#1a1a1a", border: "#2a2a2a" },
  Watchlist: { text: "#3b82f6", bg: "#1e3a5f", border: "#1d4ed8" },
  "Active Play": { text: "#10b981", bg: "#064e3b", border: "#065f46" },
  Skip: { text: "#dc2626", bg: "#7f1d1d", border: "#991b1b" },
  Done: { text: "#a855f7", bg: "#3b0764", border: "#7e22ce" },
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  High: "#dc2626",
  Medium: "#f59e0b",
  Low: "#52525b",
};

export const PLAY_STATUS_COLORS: Record<PlayStatus, string> = {
  "Belum Ada": "#52525b",
  Segera: "#f59e0b",
  Aktif: "#10b981",
  Selesai: "#3b82f6",
};

export const PLAY_TYPES = [
  "Testnet", "Early Mint", "NFTs", "Whitelist", "Social",
  "Degen", "Retro", "Role", "Grinding", "Node", "Campaign", "Mining", "Gaming"
];

export const VERDICT_STYLES: Record<NonNullable<Verdict>, { text: string; bg: string; border: string }> = {
  "Strong Play": { text: "#10b981", bg: "#064e3b", border: "#065f46" },
  Watch: { text: "#f59e0b", bg: "#78350f", border: "#92400e" },
  Ignore: { text: "#52525b", bg: "#1a1a1a", border: "#2a2a2a" },
};

export const TIMING_STYLES: Record<NonNullable<TimingWindow>, { text: string; bg: string; border: string }> = {
  Now: { text: "#dc2626", bg: "#7f1d1d", border: "#991b1b" },
  "This Week": { text: "#f59e0b", bg: "#78350f", border: "#92400e" },
  Monitor: { text: "#3b82f6", bg: "#1e3a5f", border: "#1d4ed8" },
  "No Rush": { text: "#52525b", bg: "#1a1a1a", border: "#2a2a2a" },
};

export const SCORE_LABELS: Array<{ key: keyof Project; label: string }> = [
  { key: "scoreNarrative", label: "Narrative Fit" },
  { key: "scoreBuilder", label: "Team / Builder" },
  { key: "scoreCT", label: "CT Signal" },
  { key: "scoreTiming", label: "Timing" },
  { key: "scoreExecution", label: "Execution Risk" },
];

export function computeQuickScore(p: Pick<Project, "scoreNarrative" | "scoreBuilder" | "scoreCT" | "scoreTiming" | "scoreExecution">): number | null {
  const vals = [p.scoreNarrative, p.scoreBuilder, p.scoreCT, p.scoreTiming, p.scoreExecution];
  const filled = vals.filter((v) => v !== null && v !== undefined) as number[];
  if (filled.length === 0) return null;
  return filled.reduce((a, b) => a + b, 0);
}

export function scoreColor(score: number): string {
  if (score >= 18) return "#10b981";
  if (score >= 10) return "#f59e0b";
  return "#dc2626";
}

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
  Segera:      "#D97706",
  Aktif:       "#4B7C6F",
  Selesai:     "#2563EB",
};

export const PLAY_TYPES = [
  "Testnet", "Early Mint", "NFTs", "Whitelist", "Social",
  "Degen", "Retro", "Role", "Grinding", "Node", "Campaign", "Mining", "Gaming"
];

export const VERDICT_STYLES: Record<NonNullable<Verdict>, { text: string; bg: string; border: string }> = {
  "Strong Play": { text: "#4B7C6F", bg: "#EBF4F1", border: "#A7D9CE" },
  Watch:         { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  Ignore:        { text: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB" },
};

export const TIMING_STYLES: Record<NonNullable<TimingWindow>, { text: string; bg: string; border: string }> = {
  Now:         { text: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  "This Week": { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  Monitor:     { text: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  "No Rush":   { text: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB" },
};

export const SCORE_LABELS: Array<{ key: keyof Project; label: string }> = [
  { key: "scoreNarrative",  label: "Narrative Fit"   },
  { key: "scoreBuilder",    label: "Team / Builder"   },
  { key: "scoreCT",         label: "CT Signal"        },
  { key: "scoreTiming",     label: "Timing"           },
  { key: "scoreExecution",  label: "Execution Risk"   },
];

export function computeQuickScore(p: Pick<Project, "scoreNarrative" | "scoreBuilder" | "scoreCT" | "scoreTiming" | "scoreExecution">): number | null {
  const vals = [p.scoreNarrative, p.scoreBuilder, p.scoreCT, p.scoreTiming, p.scoreExecution];
  const filled = vals.filter((v) => v !== null && v !== undefined) as number[];
  if (filled.length === 0) return null;
  return filled.reduce((a, b) => a + b, 0);
}

export function scoreColor(score: number): string {
  if (score >= 18) return "#4B7C6F";
  if (score >= 10) return "#D97706";
  return "#DC2626";
}

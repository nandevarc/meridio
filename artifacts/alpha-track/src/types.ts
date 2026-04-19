export type ProjectStatus = "Screening" | "Watchlist" | "Active Play" | "Done" | "Skip";
export type Priority = "Low" | "Medium" | "High";
export type PlayStatus = "Belum Ada" | "Segera" | "Aktif" | "Selesai";
export type Conviction = "Low" | "Medium" | "High";

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

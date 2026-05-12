export type Conviction = "Low" | "Medium" | "High";

export type PlayStatus = "Belum Ada" | "Aktif" | "Selesai" | "Skip";

export type ProjectStatus = "Screening" | "Watchlist" | "Active Play" | "Done" | "Skip";

export type Priority = "Low" | "Medium" | "High";

export type Verdict = "Strong Play" | "Watch" | "Ignore";

export type TimingWindow = "Now" | "This Week" | "Monitor" | "No Rush";

export interface ProjectLinks {
  website:  string;
  twitter:  string;
  discord:  string;
  telegram: string;
  github:   string;
}

export interface ProjectCT {
  names: string[];
  count: number;
}

export interface ProjectScores {
  narrative:  number;
  builder:    number;
  ctSignal:   number;
  timing:     number;
  execution:  number;
}

export interface Project {
  // IDENTITY
  id:   string;
  name: string;

  // CLASSIFICATION
  category: string[];
  chain:    string[];
  stage:    string[];

  // CORE DATA
  findDate: string;
  source:   string;

  // LINKS
  links: ProjectLinks;

  // ANALYSIS
  description: string;
  narrative:   string;
  builders:    string[];

  // CT SIGNAL
  ct: ProjectCT;

  // CONVICTION
  conviction?: Conviction;

  // SCORE BREAKDOWN — total is COMPUTED, never stored
  scores: ProjectScores;

  decisionNote: string;
  biasCheck:    string;

  // PLAY
  playType:       string[];
  playStatus:     PlayStatus;
  actionRequired: string;
  playNotes:      string;

  // TRACKING
  status:       ProjectStatus;
  priority:     Priority;
  verdict:      Verdict | null;
  timingWindow: TimingWindow | null;

  // TIMESTAMPS
  createdAt:      string;
  updatedAt:      string;
  lastReviewedAt: string | null;
}

export function computeTotal(scores: ProjectScores): number {
  return (
    scores.narrative +
    scores.builder +
    scores.ctSignal +
    scores.timing +
    scores.execution
  );
}

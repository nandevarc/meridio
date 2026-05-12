import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../types/project';

export function createEmptyProject(): Project {
  const now = new Date().toISOString();
  return {
    id:       uuidv4(),
    name:     "",
    category: [],
    chain:    [],
    stage:    [],
    findDate: new Date().toISOString().split("T")[0],
    source:   "",
    links: {
      website:  "",
      twitter:  "",
      discord:  "",
      telegram: "",
      github:   "",
    },
    description:    "",
    narrative:      "",
    builders:       [],
    ct: {
      names: [],
      count: 0,
    },
    conviction:     undefined,
    scores: {
      narrative:  0,
      builder:    0,
      ctSignal:   0,
      timing:     0,
      execution:  0,
    },
    decisionNote:   "",
    biasCheck:      "",
    playType:       [],
    playStatus:     "Belum Ada",
    actionRequired: "",
    playNotes:      "",
    status:         "Screening",
    priority:       "Medium",
    verdict:        null,
    timingWindow:   null,
    createdAt:      now,
    updatedAt:      now,
    lastReviewedAt: null,
  };
}

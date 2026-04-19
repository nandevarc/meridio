import { SCORE_LABELS, Project, computeQuickScore } from "../types";

interface ScoreInputProps {
  scoreNarrative: number | null;
  scoreBuilder: number | null;
  scoreCT: number | null;
  scoreTiming: number | null;
  scoreExecution: number | null;
  ctCount: number | null;
  onChange: (key: keyof Project, value: number | null) => void;
}

export function ScoreInput({ scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution, ctCount, onChange }: ScoreInputProps) {
  const scores: Record<string, number | null> = {
    scoreNarrative,
    scoreBuilder,
    scoreCT,
    scoreTiming,
    scoreExecution,
  };

  const filled = [scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution].filter((v) => v !== null && v !== undefined) as number[];
  const total = computeQuickScore({ scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution });
  const maxTotal = filled.length * 5;

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {SCORE_LABELS.map(({ key, label }) => {
        const current = scores[key as string] as number | null;
        const isCT = key === "scoreCT";
        return (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{label}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      onChange(key as keyof Project, current === n ? null : n);
                    }}
                    data-testid={`score-btn-${key}-${n}`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `1px solid ${current === n ? "#dc2626" : "var(--border)"}`,
                      background: current === n ? "#dc2626" : "var(--bg-input)",
                      color: current === n ? "#fff" : "var(--text-muted)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: current === n ? 600 : 400,
                      transition: "all 150ms ease",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {isCT && ctCount != null && ctCount > 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>
                CT count: {ctCount}
              </div>
            )}
          </div>
        );
      })}

      <div style={{
        borderTop: "1px solid var(--border)",
        paddingTop: 10,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 8,
      }}>
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Total</span>
        <span style={{ color: "#dc2626", fontSize: 14, fontWeight: 600 }}>
          {total !== null ? `${total} / ${maxTotal > 0 ? maxTotal : 25}` : "— / 25"}
        </span>
      </div>
    </div>
  );
}

interface ScoreDisplayProps {
  scoreNarrative: number | null;
  scoreBuilder: number | null;
  scoreCT: number | null;
  scoreTiming: number | null;
  scoreExecution: number | null;
}

export function ScoreDisplay({ scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution }: ScoreDisplayProps) {
  const scores: Record<string, number | null> = {
    scoreNarrative,
    scoreBuilder,
    scoreCT,
    scoreTiming,
    scoreExecution,
  };

  const total = computeQuickScore({ scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution });
  const hasAny = SCORE_LABELS.some(({ key }) => scores[key as string] !== null);
  if (!hasAny) return null;

  function dots(val: number | null): string {
    if (val === null) return "○○○○○";
    return "●".repeat(val) + "○".repeat(5 - val);
  }

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "12px",
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {SCORE_LABELS.map(({ key, label }) => {
        const val = scores[key as string] as number | null;
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 11, minWidth: 110, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 12, letterSpacing: 2, color: "var(--text-muted)" }}>
              {(dots(val)).split("").map((c, i) => (
                <span key={i} style={{ color: c === "●" ? "#dc2626" : "#222222" }}>{c}</span>
              ))}
            </span>
            <span style={{ color: "var(--text-secondary)", fontSize: 12, marginLeft: "auto" }}>
              {val !== null ? val : "—"}
            </span>
          </div>
        );
      })}
      <div style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600 }}>TOTAL</span>
        <span style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
          {total !== null ? `${total}/25` : "—/25"}
        </span>
      </div>
    </div>
  );
}

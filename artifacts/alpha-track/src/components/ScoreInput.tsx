import { SCORE_LABELS, Project, computeQuickScore } from "../types";

const ACCENT         = "#4B7C6F";
const ACCENT_LIGHT   = "#EBF4F1";
const BORDER         = "#D1D5DB";
const BORDER_SUB     = "#E5E7EB";
const SURFACE        = "#FFFFFF";
const SURFACE_RAISED = "#F3F4F6";
const TEXT_PRIMARY   = "#111827";
const TEXT_SECONDARY = "#4B5563";
const TEXT_MUTED     = "#6B7280";

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
  const scores: Record<string, number | null> = { scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution };
  const filled = [scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution].filter((v) => v !== null && v !== undefined) as number[];
  const total = computeQuickScore({ scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution });
  const maxTotal = filled.length * 5;

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
      {SCORE_LABELS.map(({ key, label }) => {
        const current = scores[key as string] as number | null;
        const isCT = key === "scoreCT";
        return (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: TEXT_SECONDARY, fontSize: 13 }}>{label}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onChange(key as keyof Project, current === n ? null : n)}
                    data-testid={`score-btn-${key}-${n}`}
                    style={{
                      width: 32, height: 32, borderRadius: 6,
                      border: `1px solid ${current === n ? ACCENT : BORDER}`,
                      background: current === n ? ACCENT : SURFACE_RAISED,
                      color: current === n ? "#FFFFFF" : TEXT_MUTED,
                      fontSize: 12, cursor: "pointer",
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
              <div style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 2 }}>CT count: {ctCount}</div>
            )}
          </div>
        );
      })}
      <div style={{ borderTop: `1px solid ${BORDER_SUB}`, paddingTop: 10, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
        <span style={{ color: TEXT_MUTED, fontSize: 12 }}>Total</span>
        <span style={{ color: ACCENT, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {total !== null ? `${total} / ${maxTotal > 0 ? maxTotal : 25}` : "— / 25"}
        </span>
      </div>
    </div>
  );
}

// ── ScoreDisplay — for forms; kept for backward compat ─────────────
// (DetailProject now uses its own inline ScoreBreakdown with real dots)

interface ScoreDisplayProps {
  scoreNarrative: number | null;
  scoreBuilder: number | null;
  scoreCT: number | null;
  scoreTiming: number | null;
  scoreExecution: number | null;
}

export function ScoreDisplay({ scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution }: ScoreDisplayProps) {
  const scores: Record<string, number | null> = { scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution };
  const total = computeQuickScore({ scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution });
  const hasAny = SCORE_LABELS.some(({ key }) => scores[key as string] !== null);
  if (!hasAny) return null;

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
      {SCORE_LABELS.map(({ key, label }) => {
        const val = scores[key as string] as number | null;
        const filled = val ?? 0;
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ color: "#374151", fontSize: 13, flex: 1 }}>{label}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: n <= filled ? ACCENT : BORDER_SUB,
                    border: n <= filled ? "none" : `1px solid ${BORDER}`,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, width: 16, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {val !== null ? val : "—"}
            </span>
          </div>
        );
      })}
      <div style={{ borderTop: `1px solid ${BORDER_SUB}`, paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: TEXT_MUTED, fontSize: 13 }}>Total</span>
        <span style={{ color: ACCENT, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {total !== null ? `${total} / 25` : "— / 25"}
        </span>
      </div>
    </div>
  );
}

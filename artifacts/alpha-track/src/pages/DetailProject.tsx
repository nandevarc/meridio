import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Project, STATUS_STYLES, PRIORITY_COLORS, PLAY_STATUS_COLORS,
  VERDICT_STYLES, TIMING_STYLES, Verdict, computeQuickScore, SCORE_LABELS
} from "../types";
import { getProject, deleteProject, updateProject, formatDate, formatDateTime } from "../utils/storage";
import { useToast } from "../context/ToastContext";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────
const ACCENT       = "#4B7C6F";
const ACCENT_LIGHT = "#EBF4F1";
const ACCENT_BORD  = "#A7D9CE";
const BORDER       = "#D1D5DB";
const BORDER_SUB   = "#E5E7EB";
const SURFACE      = "#FFFFFF";
const SURF_RAISED  = "#F3F4F6";
const TEXT_PRI     = "#111827";
const TEXT_SEC     = "#4B5563";
const TEXT_MUTED   = "#6B7280";
const RED          = "#DC2626";
const RED_LIGHT    = "#FEF2F2";
const RED_BORD     = "#FECACA";

interface Props { id: string; }

// ── Helpers ────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: TEXT_MUTED, fontSize: 10, marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ color: TEXT_SEC, fontSize: 14, lineHeight: 1.6 }}>{String(value)}</div>
    </div>
  );
}

function Tags({ tags, style }: { tags: string[]; style?: React.CSSProperties }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
      {tags.map((t) => (
        <span key={t} style={{ background: SURF_RAISED, color: TEXT_SEC, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 500, ...style }}>{t}</span>
      ))}
    </div>
  );
}

function SectionLabel({ title, color }: { title: string; color?: string }) {
  return (
    <div style={{
      color: color ?? TEXT_MUTED,
      fontSize: 11, fontWeight: 600,
      textTransform: "uppercase", letterSpacing: "0.08em",
      borderTop: `1px solid ${BORDER_SUB}`,
      paddingTop: 16, marginTop: 24, marginBottom: 8,
    }}>
      // {title}
    </div>
  );
}

// ── ScoreBreakdown ─────────────────────────────────────────────────

interface ScoreBreakdownProps {
  scoreNarrative: number | null;
  scoreBuilder: number | null;
  scoreCT: number | null;
  scoreTiming: number | null;
  scoreExecution: number | null;
}

function ScoreBreakdown({ scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution }: ScoreBreakdownProps) {
  const scores: Record<string, number | null> = { scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution };
  const total = computeQuickScore({ scoreNarrative, scoreBuilder, scoreCT, scoreTiming, scoreExecution });
  const hasAny = SCORE_LABELS.some(({ key }) => scores[key as string] !== null);
  if (!hasAny) return null;

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 16px" }}>
      {SCORE_LABELS.map(({ key, label }) => {
        const val = scores[key as string] as number | null;
        const filled = val ?? 0;
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 6, paddingBottom: 6 }}>
            <span style={{ fontSize: 14, color: TEXT_SEC, flex: 1, minWidth: 0 }}>{label}</span>
            <div style={{ display: "flex", gap: 6, marginLeft: 12, marginRight: 12 }}>
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
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRI, width: 20, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {val !== null ? val : "—"}
            </span>
          </div>
        );
      })}
      <div style={{ borderTop: `2px solid ${BORDER}`, paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_SEC }}>Total</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>
          {total !== null ? `${total} / 25` : "— / 25"}
        </span>
      </div>
    </div>
  );
}

// ── DetailProject page ─────────────────────────────────────────────

export default function DetailProject({ id }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [, setLocation] = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    const p = getProject(id);
    setProject(p ?? null);
  }, [id]);

  if (!project) {
    return (
      <div style={{ background: "#FAFAFA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: TEXT_MUTED }}>project tidak ditemukan</div>
      </div>
    );
  }

  const statusStyle   = STATUS_STYLES[project.status];
  const priorityColor = PRIORITY_COLORS[project.priority];
  const qs = computeQuickScore(project);

  function generateShareText(): string {
    const lines: string[] = [];
    lines.push(`◈ ${project!.name.toUpperCase()}`);
    const meta = [
      ...(project!.chain.length ? project!.chain : []),
      ...(project!.category.length ? project!.category : []),
      ...(project!.stage.length ? project!.stage : []),
    ].join(" · ");
    if (meta) lines.push(meta);
    lines.push("");
    const desc = project!.narrative || project!.description;
    if (desc) lines.push(desc);
    if (project!.builder) lines.push(`Builder: ${project!.builder}`);
    if (project!.ctSignal) {
      const ctPart = (project!.ctCount != null && project!.ctCount > 0) ? ` (${project!.ctCount}×)` : "";
      lines.push(`CT Signal: ${project!.ctSignal}${ctPart}`);
    }
    if (project!.actionRequired) lines.push(`Play: ${project!.actionRequired}`);
    if (project!.playTypes.length) lines.push(`Type: ${project!.playTypes.join(", ")}`);
    if (project!.timingWindow) lines.push(`Timing: ${project!.timingWindow}`);
    if (qs !== null) lines.push(`Score: ${qs}/25`);
    if (project!.verdict) lines.push(`Verdict: ${project!.verdict}`);
    if (project!.website) lines.push(project!.website);
    if (project!.twitter) lines.push(project!.twitter);
    return lines.join("\n");
  }

  function handleDelete() {
    deleteProject(project!.id);
    showToast("project dihapus");
    setLocation("/");
  }

  function handleVerdictChange(v: Verdict) {
    if (!project) return;
    const updated = { ...project, verdict: v, updatedAt: new Date().toISOString() };
    updateProject(updated);
    setProject(updated);
    showToast(`verdict → ${v ?? "cleared"}`);
  }

  const links = [
    { key: "website",  label: "Website",     url: project.website  },
    { key: "twitter",  label: "Twitter / X", url: project.twitter  },
    { key: "discord",  label: "Discord",     url: project.discord  },
    { key: "telegram", label: "Telegram",    url: project.telegram },
    { key: "github",   label: "GitHub",      url: project.github   },
  ].filter((l) => l.url);

  const verdictOptions: NonNullable<Verdict>[] = ["Strong Play", "Watch", "Ignore"];

  const pillStyle: React.CSSProperties = {
    background: SURF_RAISED, border: `1px solid ${BORDER}`,
    color: TEXT_SEC, borderRadius: 999,
    padding: "4px 10px", fontSize: 12, fontWeight: 500,
  };

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", paddingBottom: 32 }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
        <button type="button" onClick={() => setLocation("/")} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, display: "flex", alignItems: "center", padding: 4, minHeight: 36 }} data-testid="btn-back">
          <ArrowLeft size={18} />
        </button>
        <span className="syne" style={{ fontWeight: 800, fontSize: 18, color: TEXT_PRI, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {project.name}
        </span>
        <button type="button" onClick={() => setLocation(`/project/${project.id}/edit`)} data-testid="btn-edit"
          style={{ background: SURF_RAISED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 14px", minHeight: 36, color: TEXT_SEC, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
          <Edit size={12} /> edit
        </button>
      </div>

      <div style={{ padding: "16px" }}>

        {/* ROW 2: Status group pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          <span style={{ ...pillStyle, background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>{project.status}</span>
          <span style={{ ...pillStyle, color: priorityColor }}>{project.priority}</span>
          <span style={pillStyle}>{project.conviction}</span>
        </div>

        {/* ROW 3: Score Hero */}
        {qs !== null && (
          <div style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORD}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: ACCENT, marginBottom: 6 }}>
                Conviction Score
              </div>
              {project.timingWindow && TIMING_STYLES[project.timingWindow] && (
                <span style={{ background: TIMING_STYLES[project.timingWindow].bg, color: TIMING_STYLES[project.timingWindow].text, border: `1px solid ${TIMING_STYLES[project.timingWindow].border}`, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>
                  {project.timingWindow}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: ACCENT, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{qs}</span>
              <span style={{ fontSize: 15, color: ACCENT, opacity: 0.6 }}>/25</span>
            </div>
          </div>
        )}

        {/* ROW 4: Quick verdict — interactive */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 10, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Quick Verdict</div>
          <div style={{ display: "flex", gap: 6 }}>
            {verdictOptions.map((v) => {
              const isSelected = project.verdict === v;
              const s = VERDICT_STYLES[v];
              return (
                <button key={v} type="button" onClick={() => handleVerdictChange(isSelected ? null : v)} data-testid={`verdict-quick-${v}`}
                  style={{
                    flex: 1, height: 36, borderRadius: 8,
                    border: `1px solid ${isSelected ? s.border : BORDER}`,
                    background: isSelected ? s.bg : SURF_RAISED,
                    color: isSelected ? s.text : TEXT_MUTED,
                    fontSize: 11, cursor: "pointer",
                    fontWeight: isSelected ? 600 : 400,
                    transition: "all 150ms ease",
                  }}>
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        {/* Core data */}
        <SectionLabel title="Core Data" />
        <Tags tags={project.chain} />
        <Tags tags={project.category} style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }} />
        <Tags tags={project.stage} />
        {project.findDate && <Row label="Find Date" value={formatDate(project.findDate)} />}
        {project.source && <Row label="Source" value={project.source} />}

        {/* Analysis */}
        {(project.description || project.narrative || project.builder || project.ctSignal || project.decisionNote || project.biaCheck) && (
          <>
            <SectionLabel title="Analysis" />
            <Row label="Description" value={project.description} />
            <Row label="Narrative" value={project.narrative} />
            <Row label="Builder & Team" value={project.builder} />
            {(project.ctSignal || (project.ctCount != null && project.ctCount > 0)) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: TEXT_MUTED, fontSize: 10, marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>CT Signal</div>
                <div style={{ color: TEXT_SEC, fontSize: 14, lineHeight: 1.6 }}>
                  {project.ctSignal}
                  {project.ctCount != null && project.ctCount > 0 && (
                    <span> · <span style={{ color: RED, fontWeight: 600 }}>{project.ctCount}×</span></span>
                  )}
                </div>
              </div>
            )}
            <Row label="Decision Note" value={project.decisionNote} />
            {project.biaCheck && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: TEXT_MUTED, fontSize: 10, marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Bias Check</div>
                <div style={{ color: TEXT_SEC, fontSize: 14, lineHeight: 1.6 }}>{project.biaCheck}</div>
              </div>
            )}
          </>
        )}

        {/* Score Breakdown */}
        {(project.scoreNarrative !== null || project.scoreBuilder !== null || project.scoreCT !== null || project.scoreTiming !== null || project.scoreExecution !== null) && (
          <>
            <SectionLabel title="Score Breakdown" />
            <ScoreBreakdown
              scoreNarrative={project.scoreNarrative}
              scoreBuilder={project.scoreBuilder}
              scoreCT={project.scoreCT}
              scoreTiming={project.scoreTiming}
              scoreExecution={project.scoreExecution}
            />
          </>
        )}

        {/* Play */}
        {(project.playTypes.length > 0 || project.actionRequired || project.playNotes || project.playStatus !== "Belum Ada") && (
          <>
            <SectionLabel title="Play" />
            {project.playStatus !== "Belum Ada" && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: TEXT_MUTED, fontSize: 10, marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Play Status</div>
                <span style={{ color: PLAY_STATUS_COLORS[project.playStatus], fontSize: 14, fontWeight: 500 }}>{project.playStatus}</span>
              </div>
            )}
            {project.playTypes.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: TEXT_MUTED, fontSize: 10, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Jenis Play</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {project.playTypes.map((pt) => (
                    <span key={pt} style={{ background: ACCENT_LIGHT, color: ACCENT, border: `1px solid ${ACCENT_BORD}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>{pt}</span>
                  ))}
                </div>
              </div>
            )}
            <Row label="Action Required" value={project.actionRequired} />
            <Row label="Play Notes" value={project.playNotes} />
          </>
        )}

        {/* Kill Signal */}
        {project.reasonToDrop && (
          <>
            <SectionLabel title="Kill Signal" color={RED} />
            <div style={{ color: "rgba(220,38,38,0.85)", fontSize: 14, lineHeight: 1.6 }}>{project.reasonToDrop}</div>
          </>
        )}

        {/* Links */}
        {links.length > 0 && (
          <>
            <SectionLabel title="Links" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {links.map((l) => (
                <a key={l.key} href={l.url} target="_blank" rel="noopener noreferrer" data-testid={`link-${l.key}`}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: `1px solid ${SURF_RAISED}`, textDecoration: "none", minHeight: 40 }}>
                  <span style={{ color: TEXT_MUTED, fontSize: 12, width: 80, flexShrink: 0 }}>{l.label}</span>
                  <span style={{ color: ACCENT, fontSize: 12, textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{l.url}</span>
                  <ExternalLink size={12} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </>
        )}

        {/* Timestamps — single compressed line */}
        <div style={{ marginTop: 16, paddingTop: 8, borderTop: `1px solid ${SURF_RAISED}` }}>
          <span style={{ color: "#9CA3AF", fontSize: 12 }}>
            Created {formatDate(project.createdAt)} · Updated {formatDate(project.updatedAt)}
          </span>
        </div>

        {/* Bottom actions — Step 4 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, marginBottom: 32 }}>
          <button type="button" onClick={() => setShowShare(true)} data-testid="btn-generate-share"
            style={{ width: "100%", height: 44, background: ACCENT, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(75,124,111,0.2)" }}>
            generate share text
          </button>
          <button type="button" onClick={() => setShowDeleteModal(true)} data-testid="btn-hapus-project"
            style={{ width: "100%", height: 44, background: SURFACE, color: RED, border: `1px solid ${RED_BORD}`, borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            hapus project
          </button>
        </div>
      </div>

      {/* Share bottom sheet */}
      {showShare && (
        <>
          <div onClick={() => setShowShare(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px 16px 0 0", padding: 24, zIndex: 101, maxWidth: 480, margin: "0 auto", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
            <div style={{ color: TEXT_MUTED, fontSize: 11, marginBottom: 12, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.07em" }}>Share Text</div>
            <pre style={{ background: SURF_RAISED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, color: TEXT_SEC, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "pre-wrap", marginBottom: 16, maxHeight: 200, overflow: "auto" }}>
              {generateShareText()}
            </pre>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(generateShareText()).catch(() => {}); showToast("teks disalin"); setShowShare(false); }} data-testid="btn-salin"
              style={{ width: "100%", height: 48, background: ACCENT, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", fontWeight: 600, boxShadow: "0 2px 8px rgba(75,124,111,0.25)", marginBottom: 12 }}>
              Salin Teks
            </button>
            <div style={{ textAlign: "center" }}>
              <button type="button" onClick={() => setShowShare(false)} style={{ background: "none", border: "none", color: TEXT_MUTED, fontSize: 13, cursor: "pointer" }}>Tutup</button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm modal */}
      {showDeleteModal && (
        <>
          <div onClick={() => setShowDeleteModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24, zIndex: 201, width: "calc(100% - 48px)", maxWidth: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ color: TEXT_PRI, fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Yakin hapus <strong>{project.name}</strong>?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setShowDeleteModal(false)} data-testid="btn-batal-delete" style={{ flex: 1, height: 44, background: SURF_RAISED, color: TEXT_SEC, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Batal</button>
              <button type="button" onClick={handleDelete} data-testid="btn-confirm-hapus" style={{ flex: 1, height: 44, background: RED_LIGHT, color: RED, border: `1px solid ${RED_BORD}`, borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Hapus</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

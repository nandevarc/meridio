import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Project, STATUS_STYLES, PRIORITY_COLORS, PLAY_STATUS_COLORS,
  VERDICT_STYLES, TIMING_STYLES, Verdict, computeQuickScore, scoreColor
} from "../types";
import { getProject, deleteProject, updateProject, formatDate, formatDateTime } from "../utils/storage";
import { useToast } from "../context/ToastContext";
import { ScoreDisplay } from "../components/ScoreInput";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";

interface Props { id: string; }

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{String(value)}</div>
    </div>
  );
}

function Tags({ tags, style }: { tags: string[]; style?: React.CSSProperties }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
      {tags.map((t) => (
        <span key={t} style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 999, padding: "3px 10px", fontSize: 11, ...style }}>{t}</span>
      ))}
    </div>
  );
}

function SectionLabel({ title, color }: { title: string; color?: string }) {
  return (
    <div style={{ color: color ?? "var(--text-muted)", fontSize: 11, marginTop: 20, marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${color ? color + "44" : "var(--border)"}`, paddingBottom: 8 }}>
      // {title}
    </div>
  );
}

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
      <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)" }}>project tidak ditemukan</div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[project.status];
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
    { key: "website", label: "Website", url: project.website },
    { key: "twitter", label: "Twitter / X", url: project.twitter },
    { key: "discord", label: "Discord", url: project.discord },
    { key: "telegram", label: "Telegram", url: project.telegram },
    { key: "github", label: "GitHub", url: project.github },
  ].filter((l) => l.url);

  const verdictOptions: NonNullable<Verdict>[] = ["Strong Play", "Watch", "Ignore"];

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--bg-base)", borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={() => setLocation("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4 }} data-testid="btn-back">
          <ArrowLeft size={18} />
        </button>
        <span className="syne" style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {project.name}
        </span>
        <button type="button" onClick={() => setLocation(`/project/${project.id}/edit`)} data-testid="btn-edit" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", display: "flex", alignItems: "center", gap: 6 }}>
          <Edit size={12} /> edit
        </button>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Verdict badge — prominent, below name */}
        {project.verdict && VERDICT_STYLES[project.verdict] && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ background: VERDICT_STYLES[project.verdict].bg, color: VERDICT_STYLES[project.verdict].text, border: `1px solid ${VERDICT_STYLES[project.verdict].border}`, borderRadius: 999, padding: "6px 12px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              {project.verdict}
            </span>
          </div>
        )}

        {/* Status/priority/conviction/timing row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`, borderRadius: 999, padding: "4px 12px", fontSize: 12 }}>{project.status}</span>
          <span style={{ background: "var(--bg-elevated)", color: priorityColor, border: "1px solid var(--border)", borderRadius: 999, padding: "4px 12px", fontSize: 12 }}>{project.priority}</span>
          <span style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 999, padding: "4px 12px", fontSize: 12 }}>{project.conviction}</span>
          {project.timingWindow && TIMING_STYLES[project.timingWindow] && (
            <span style={{ background: TIMING_STYLES[project.timingWindow].bg, color: TIMING_STYLES[project.timingWindow].text, border: `1px solid ${TIMING_STYLES[project.timingWindow].border}`, borderRadius: 999, padding: "4px 12px", fontSize: 12 }}>
              {project.timingWindow}
            </span>
          )}
          {qs !== null && (
            <span style={{ background: "var(--bg-elevated)", color: scoreColor(qs), border: "1px solid var(--border)", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
              {qs}/25
            </span>
          )}
        </div>

        {/* Quick verdict selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "var(--text-muted)", fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Verdict</div>
          <div style={{ display: "flex", gap: 6 }}>
            {verdictOptions.map((v) => {
              const isSelected = project.verdict === v;
              const s = VERDICT_STYLES[v];
              return (
                <button key={v} type="button" onClick={() => handleVerdictChange(isSelected ? null : v)} data-testid={`verdict-quick-${v}`} style={{ flex: 1, height: 36, borderRadius: 10, border: `1px solid ${isSelected ? s.border : "var(--border)"}`, background: isSelected ? s.bg : "var(--bg-elevated)", color: isSelected ? s.text : "var(--text-muted)", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", transition: "all 150ms ease" }}>
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        {/* Core data */}
        <SectionLabel title="Core Data" />
        <Tags tags={project.chain} />
        <Tags tags={project.category} style={{ background: "#1e293b", color: "#64748b" }} />
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
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>CT Signal</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  {project.ctSignal}
                  {project.ctCount != null && project.ctCount > 0 && (
                    <span> · <span style={{ color: "#dc2626" }}>{project.ctCount}×</span></span>
                  )}
                </div>
              </div>
            )}
            <Row label="Decision Note" value={project.decisionNote} />
            {project.biaCheck && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>bias check</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{project.biaCheck}</div>
              </div>
            )}
          </>
        )}

        {/* Scoring section */}
        {(project.scoreNarrative !== null || project.scoreBuilder !== null || project.scoreCT !== null || project.scoreTiming !== null || project.scoreExecution !== null) && (
          <>
            <SectionLabel title="06. Scoring" />
            <ScoreDisplay
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
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>Play Status</div>
                <span style={{ color: PLAY_STATUS_COLORS[project.playStatus], fontSize: 13 }}>{project.playStatus}</span>
              </div>
            )}
            {project.playTypes.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 6 }}>Jenis Play</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {project.playTypes.map((pt) => (
                    <span key={pt} style={{ background: "var(--emerald-dim)", color: "var(--emerald)", borderRadius: 999, padding: "3px 10px", fontSize: 11 }}>{pt}</span>
                  ))}
                </div>
              </div>
            )}
            <Row label="Action Required" value={project.actionRequired} />
            <Row label="Play Notes" value={project.playNotes} />
          </>
        )}

        {/* Kill Signal section */}
        {project.reasonToDrop && (
          <>
            <SectionLabel title="Kill Signal" color="#dc2626" />
            <div style={{ color: "rgba(220,38,38,0.7)", fontSize: 13 }}>{project.reasonToDrop}</div>
          </>
        )}

        {/* Links */}
        {links.length > 0 && (
          <>
            <SectionLabel title="Links" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {links.map((l) => (
                <a key={l.key} href={l.url} target="_blank" rel="noopener noreferrer" data-testid={`link-${l.key}`} style={{ color: "var(--blue)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  <ExternalLink size={12} />
                  <span style={{ color: "var(--text-muted)", fontSize: 11, minWidth: 60 }}>{l.label}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.url}</span>
                </a>
              ))}
            </div>
          </>
        )}

        {/* Timestamps */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>Created: {formatDateTime(project.createdAt)}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>Updated: {formatDateTime(project.updatedAt)}</div>
        </div>

        {/* Share button */}
        <button type="button" onClick={() => setShowShare(true)} data-testid="btn-generate-share" style={{ width: "100%", marginTop: 20, background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 12, height: 48, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
          generate share text
        </button>

        {/* Delete link */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button type="button" onClick={() => setShowDeleteModal(true)} data-testid="btn-hapus-project" style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
            hapus project
          </button>
        </div>
      </div>

      {/* Share bottom sheet */}
      {showShare && (
        <>
          <div onClick={() => setShowShare(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "16px 16px 0 0", padding: 24, zIndex: 101, maxWidth: 480, margin: "0 auto" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 12, textTransform: "uppercase" }}>Share Text</div>
            <pre style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, color: "var(--text-secondary)", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "pre-wrap", marginBottom: 16, maxHeight: 200, overflow: "auto" }}>
              {generateShareText()}
            </pre>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(generateShareText()).catch(() => {}); showToast("teks disalin"); setShowShare(false); }} data-testid="btn-salin" style={{ width: "100%", height: 48, background: "var(--red)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12 }}>
              Salin Teks
            </button>
            <div style={{ textAlign: "center" }}>
              <button type="button" onClick={() => setShowShare(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>Tutup</button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm modal */}
      {showDeleteModal && (
        <>
          <div onClick={() => setShowDeleteModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, zIndex: 201, width: "calc(100% - 48px)", maxWidth: 360 }}>
            <div style={{ color: "var(--text-primary)", fontSize: 14, marginBottom: 20 }}>
              Yakin hapus <strong>{project.name}</strong>?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setShowDeleteModal(false)} data-testid="btn-batal-delete" style={{ flex: 1, height: 44, background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>Batal</button>
              <button type="button" onClick={handleDelete} data-testid="btn-confirm-hapus" style={{ flex: 1, height: 44, background: "var(--red-dim)", color: "var(--red)", border: "1px solid #991b1b", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>Hapus</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Project, ProjectStatus, Priority,
  STATUS_ORDER, STATUS_STYLES, PRIORITY_COLORS, PLAY_STATUS_COLORS,
  VERDICT_STYLES, computeQuickScore,
} from "../types";
import { getProjects, updateProject, deleteProject } from "../utils/storage";
import { getAllProjects, saveAllProjects } from "../lib/storage";
import { exportBackup, importBackup } from "../lib/exportImport";
import { useToast } from "../context/ToastContext";
import { Settings, Plus, ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────
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

// ── Timing left border colors ─────────────────────────────────────
const TIMING_LEFT_BORDER: Record<string, string> = {
  "Now":       "#F87171",
  "This Week": "#FBBF24",
  "Monitor":   "#60A5FA",
  "No Rush":   "#E5E7EB",
};

// ── Timing badge colors ───────────────────────────────────────────
const TIMING_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  "Now":       { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
  "This Week": { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
  "Monitor":   { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" },
  "No Rush":   { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" },
};

// ── Utilities ─────────────────────────────────────────────────────
function cycleStatus(current: ProjectStatus): ProjectStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

function sortProjects(projects: Project[]): Project[] {
  const priorityOrder: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
  return [...projects].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function generateShareText(project: Project): string {
  const lines: string[] = [];
  lines.push(`◈ ${project.name.toUpperCase()}`);
  const meta = [
    ...(project.chain.length ? project.chain : []),
    ...(project.category.length ? project.category : []),
    ...(project.stage.length ? project.stage : []),
  ].join(" · ");
  if (meta) lines.push(meta);
  lines.push("");
  const desc = project.narrative || project.description;
  if (desc) lines.push(desc);
  if (project.builders.length) lines.push(`Builder: ${project.builders.join(", ")}`);
  if (project.ct.names.length) {
    const ctPart = project.ct.count > 0 ? ` (${project.ct.count}×)` : "";
    lines.push(`CT Signal: ${project.ct.names.join(", ")}${ctPart}`);
  }
  if (project.actionRequired) lines.push(`Play: ${project.actionRequired}`);
  if (project.playType.length) lines.push(`Type: ${project.playType.join(", ")}`);
  if (project.timingWindow) lines.push(`Timing: ${project.timingWindow}`);
  const qs = computeQuickScore(project.scores);
  if (qs !== null) lines.push(`Score: ${qs}/25`);
  if (project.verdict) lines.push(`Verdict: ${project.verdict}`);
  if (project.links.website) lines.push(project.links.website);
  if (project.links.twitter) lines.push(project.links.twitter);
  return lines.join("\n");
}

const clamp3: React.CSSProperties = {
  display: "-webkit-box", WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical", overflow: "hidden",
};

// ── CollapsibleSection ────────────────────────────────────────────

interface CollapsibleSectionProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ label, open, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          minHeight: 40,
          background: "none", border: "none", borderTop: `1px solid ${BORDER_SUB}`,
          padding: "8px 0", cursor: "pointer",
          transition: "all 150ms ease-in-out",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_MUTED }}>
          {label}
        </span>
        {open
          ? <ChevronUp size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          : <ChevronDown size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
        }
      </button>
      <div style={{
        maxHeight: open ? 800 : 0, overflow: "hidden",
        transition: "max-height 200ms ease-in-out",
      }}>
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── ProjectCard ───────────────────────────────────────────────────

interface CardProps {
  project: Project;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onDelete: (id: string) => void;
}

function ProjectCard({ project, onStatusChange, onDelete }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sectionOpen, setSectionOpen] = useState({ analysis: false, playDetail: false, linksSource: false });
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showFullNarr, setShowFullNarr] = useState(false);
  const [, setLocation] = useLocation();

  const qs = computeQuickScore(project.scores);
  const isDimmed     = project.verdict === "Ignore" || project.status === "Skip";
  const isHighScore  = !isDimmed && qs !== null && qs >= 18;
  const isStrongPlay = !isDimmed && project.verdict === "Strong Play";
  const isActiveHigh = !isDimmed && project.status === "Active Play" && project.priority === "High";

  let cardBg = SURFACE;
  let cardBorderColor = BORDER;
  if (!isDimmed && isHighScore) { cardBg = ACCENT_LIGHT; cardBorderColor = ACCENT_BORD; }

  const timingLeftColor = (!isDimmed && project.timingWindow)
    ? (TIMING_LEFT_BORDER[project.timingWindow] ?? "transparent")
    : "transparent";

  const statusStyle   = STATUS_STYLES[project.status];
  const priorityColor = PRIORITY_COLORS[project.priority];

  let nameColor = TEXT_PRI;
  if (isDimmed) nameColor = TEXT_MUTED;
  else if (isStrongPlay) nameColor = ACCENT;

  const links = [
    { key: "website",  label: "web",     url: project.links.website  },
    { key: "twitter",  label: "X",       url: project.links.twitter  },
    { key: "discord",  label: "discord", url: project.links.discord  },
    { key: "telegram", label: "tg",      url: project.links.telegram },
    { key: "github",   label: "gh",      url: project.links.github   },
  ].filter((l) => l.url);

  const actionText    = project.actionRequired || "";
  const playNotesText = project.playNotes || "";
  const showActionRow = actionText !== "" || playNotesText !== "";
  const actionRowText = actionText || playNotesText;

  const ctCount   = project.ct.count;
  const showCTRow = ctCount > 0;
  const showPlayBadge = !isDimmed && project.playStatus === "Aktif";

  const hasAnalysis    = !!(project.description || project.narrative || project.builders.length > 0
    || project.ct.names.length > 0 || project.ct.count > 0 || project.decisionNote);
  const hasPlayDetail  = !!(project.playNotes || (project.playStatus && project.playStatus !== "Belum Ada"));
  const hasLinksSource = links.length > 0 || !!project.source;

  return (
    <div
      data-testid={`card-project-${project.id}`}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorderColor}`,
        borderLeft: `3px solid ${timingLeftColor}`,
        borderRadius: "0 12px 12px 0",
        overflow: "hidden",
        opacity: isDimmed ? 0.45 : 1,
        transition: "opacity 150ms ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        marginBottom: 8,
      }}
    >
      {/* ── Collapsed area ───────────────────────────────────── */}
      <div onClick={() => setExpanded((e) => !e)} style={{ padding: "12px 12px 10px", cursor: "pointer", userSelect: "none" }}>

        {/* Row 1 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
            <div
              className={isActiveHigh ? "pulse-red" : ""}
              style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColor, flexShrink: 0 }}
            />
            {project.timingWindow && TIMING_BADGE[project.timingWindow] && (
              <span
                className={project.timingWindow === "Now" ? "pulse-red" : ""}
                style={{
                  background: TIMING_BADGE[project.timingWindow].bg,
                  color: TIMING_BADGE[project.timingWindow].text,
                  border: `1px solid ${TIMING_BADGE[project.timingWindow].border}`,
                  borderRadius: 999, padding: "2px 7px",
                  fontSize: 10, fontWeight: 600, flexShrink: 0,
                }}
              >
                {project.timingWindow}
              </span>
            )}
            {isHighScore && <span style={{ color: ACCENT, fontSize: 12, flexShrink: 0 }}>◈</span>}
            <span
              className="syne"
              style={{ color: nameColor, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 1 }}
            >
              {project.name}
            </span>
            {project.verdict && VERDICT_STYLES[project.verdict] && (
              <span style={{ background: VERDICT_STYLES[project.verdict].bg, color: VERDICT_STYLES[project.verdict].text, border: `1px solid ${VERDICT_STYLES[project.verdict].border}`, borderRadius: 999, padding: "2px 7px", fontSize: 10, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>
                {project.verdict}
              </span>
            )}
          </div>
          <span style={{ color: TEXT_MUTED, flexShrink: 0, marginRight: 4, display: "flex", alignItems: "center", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}>
            <ChevronDown size={13} />
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onStatusChange(project.id, cycleStatus(project.status)); }}
            data-testid={`status-badge-${project.id}`}
            style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`, borderRadius: 999, padding: "3px 10px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {project.status}
          </button>
        </div>

        {/* Row 2 — tags */}
        {(project.chain.length > 0 || project.category.length > 0 || project.stage.length > 0) && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            {project.chain.map((c) => (
              <span key={c} style={{ background: SURF_RAISED, color: TEXT_SEC, border: `1px solid ${BORDER_SUB}`, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 500 }}>{c}</span>
            ))}
            {project.category.map((c) => (
              <span key={c} style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 500 }}>{c}</span>
            ))}
            {project.stage.map((s) => (
              <span key={s} style={{ background: SURF_RAISED, color: TEXT_SEC, border: `1px solid ${BORDER_SUB}`, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 500 }}>{s}</span>
            ))}
          </div>
        )}

        {/* Row 3 — CT + play badge + score */}
        {(showCTRow || showPlayBadge || qs !== null) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {showCTRow && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: TEXT_MUTED }}>CT</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_SEC }}>{ctCount} signals</span>
              </span>
            )}
            {showPlayBadge && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: PLAY_STATUS_COLORS[project.playStatus], display: "inline-block" }} />
                <span style={{ color: PLAY_STATUS_COLORS[project.playStatus] }}>{project.playStatus}</span>
              </span>
            )}
            {qs !== null && (
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORD}`, borderRadius: 6, padding: "3px 8px" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>{qs} / 25</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Action required row ───────────────────────────────── */}
      {showActionRow && (
        <div
          onClick={() => setExpanded((e) => !e)}
          style={{ background: "#F0F7F5", borderTop: `1px solid ${BORDER_SUB}`, borderLeft: `2px solid ${ACCENT}`, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginTop: -1 }}
        >
          <span style={{ color: ACCENT, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>→</span>
          <span style={{ color: TEXT_SEC, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {actionRowText}
          </span>
        </div>
      )}

      {/* ── Expanded drawer ───────────────────────────────────── */}
      <div style={{
        background: "#F9FAFB",
        borderTop: expanded ? `1px solid ${BORDER_SUB}` : "none",
        maxHeight: expanded ? 1200 : 0,
        overflow: "hidden",
        opacity: expanded ? 1 : 0,
        transition: "max-height 220ms ease-out, opacity 150ms ease-out",
      }}>
        <div style={{ padding: "10px 12px 4px" }}>

          {project.playType.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {project.playType.map((pt) => (
                <span key={pt} style={{ background: ACCENT_LIGHT, color: ACCENT, border: `1px solid ${ACCENT_BORD}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>{pt}</span>
              ))}
            </div>
          )}

          {/* Analysis */}
          {hasAnalysis && (
            <CollapsibleSection label="Analysis" open={sectionOpen.analysis} onToggle={() => setSectionOpen((s) => ({ ...s, analysis: !s.analysis }))}>
              {project.description && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Description</div>
                  <div style={{ color: TEXT_PRI, fontSize: 13, lineHeight: 1.5, ...(showFullDesc ? {} : clamp3) }}>{project.description}</div>
                  {project.description.length > 180 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowFullDesc((v) => !v); }} style={{ background: "none", border: "none", color: ACCENT, fontSize: 11, fontWeight: 500, cursor: "pointer", padding: "2px 0" }}>
                      {showFullDesc ? "lihat lebih sedikit" : "lihat semua →"}
                    </button>
                  )}
                </div>
              )}
              {project.narrative && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Narrative</div>
                  <div style={{ color: TEXT_PRI, fontSize: 13, lineHeight: 1.5, ...(showFullNarr ? {} : clamp3) }}>{project.narrative}</div>
                  {project.narrative.length > 180 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowFullNarr((v) => !v); }} style={{ background: "none", border: "none", color: ACCENT, fontSize: 11, fontWeight: 500, cursor: "pointer", padding: "2px 0" }}>
                      {showFullNarr ? "lihat lebih sedikit" : "lihat semua →"}
                    </button>
                  )}
                </div>
              )}
              {project.builders.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Builder & Team</div>
                  <div style={{ color: TEXT_PRI, fontSize: 13 }}>{project.builders.join(", ")}</div>
                </div>
              )}
              {(project.ct.names.length > 0 || project.ct.count > 0) && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>CT Signal</div>
                  <div style={{ color: TEXT_PRI, fontSize: 13 }}>
                    {project.ct.names.join(", ")}
                    {project.ct.count > 0 && (
                      <span> · <span style={{ color: RED, fontWeight: 600 }}>{project.ct.count}×</span></span>
                    )}
                  </div>
                </div>
              )}
              {project.decisionNote && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Decision Note</div>
                  <div style={{ color: TEXT_PRI, fontSize: 13 }}>{project.decisionNote}</div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Play Detail */}
          {hasPlayDetail && (
            <CollapsibleSection label="Play Detail" open={sectionOpen.playDetail} onToggle={() => setSectionOpen((s) => ({ ...s, playDetail: !s.playDetail }))}>
              {project.playStatus && project.playStatus !== "Belum Ada" && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Play Status</div>
                  <span style={{ color: PLAY_STATUS_COLORS[project.playStatus], fontSize: 13, fontWeight: 500 }}>{project.playStatus}</span>
                </div>
              )}
              {project.playNotes && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Play Notes</div>
                  <div style={{ color: TEXT_PRI, fontSize: 13, lineHeight: 1.5 }}>{project.playNotes}</div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Links & Source */}
          {hasLinksSource && (
            <CollapsibleSection label="Links & Source" open={sectionOpen.linksSource} onToggle={() => setSectionOpen((s) => ({ ...s, linksSource: !s.linksSource }))}>
              {project.source && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Source</div>
                  <div style={{ color: TEXT_PRI, fontSize: 13 }}>{project.source}</div>
                </div>
              )}
              {links.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {links.map((l) => (
                    <a key={l.key} href={l.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} data-testid={`link-${l.key}-${project.id}`} style={{ color: "#2563EB", fontSize: 11, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                      <ExternalLink size={10} />{l.label}
                    </a>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Action buttons — detail, edit, share, hapus */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 10, paddingBottom: 10, borderTop: `1px solid ${BORDER_SUB}`, marginTop: 4, flexWrap: "wrap" }}>
            <button type="button" onClick={(e) => { e.stopPropagation(); setLocation(`/project/${project.id}`); }} data-testid={`btn-detail-${project.id}`}
              style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: ACCENT, color: "#fff", border: "none", minWidth: 56 }}>
              detail
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setLocation(`/project/${project.id}/edit`); }} data-testid={`btn-edit-${project.id}`}
              style={{ height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", background: SURF_RAISED, color: TEXT_SEC, border: `1px solid ${BORDER}` }}>
              edit
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); const t = generateShareText(project); navigator.clipboard?.writeText(t).catch(() => {}); alert(t); }} data-testid={`btn-share-${project.id}`}
              style={{ height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", background: SURF_RAISED, color: TEXT_SEC, border: `1px solid ${BORDER}` }}>
              share
            </button>
            {!confirmDelete ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} data-testid={`btn-hapus-${project.id}`}
                style={{ height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", background: RED_LIGHT, color: RED, border: `1px solid ${RED_BORD}`, marginLeft: "auto" }}>
                hapus
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }} onClick={(e) => e.stopPropagation()}>
                <span style={{ color: TEXT_SEC, fontSize: 11 }}>Hapus?</span>
                <button type="button" onClick={() => setConfirmDelete(false)} data-testid={`btn-batal-${project.id}`}
                  style={{ height: 32, padding: "0 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: SURF_RAISED, color: TEXT_SEC, border: `1px solid ${BORDER}`, fontWeight: 500 }}>
                  Batal
                </button>
                <button type="button" onClick={() => onDelete(project.id)} data-testid={`btn-confirm-hapus-${project.id}`}
                  style={{ height: 32, padding: "0 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: RED_LIGHT, color: RED, border: `1px solid ${RED_BORD}`, fontWeight: 500 }}>
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Settings sheet ────────────────────────────────────────────────

const settingBtnStyle: React.CSSProperties = {
  background: SURF_RAISED, color: TEXT_SEC, border: `1px solid ${BORDER}`,
  borderRadius: 10, padding: "12px 16px", fontSize: 13,
  cursor: "pointer", fontFamily: "'Inter', sans-serif", textAlign: "left",
};

function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  function handleBackup() {
    exportBackup(getAllProjects());
    showToast("backup berhasil");
    onClose();
  }

  function handleRestore() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      importBackup(
        file,
        (projects) => {
          saveAllProjects(projects);
          showToast(`data diimport · ${projects.length} project`);
          onClose();
          window.location.reload();
        },
        (msg) => alert(msg)
      );
    };
    input.click();
  }

  function handleClearAll() {
    if (!confirmClear) { setConfirmClear(true); return; }
    saveAllProjects([]);
    showToast("semua data dihapus");
    onClose();
    window.location.reload();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px 16px 0 0", padding: 24, zIndex: 101, maxWidth: 480, margin: "0 auto", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ color: TEXT_MUTED, fontSize: 11, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Settings</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button type="button" onClick={handleBackup} data-testid="btn-backup" style={settingBtnStyle}>Backup Data (JSON)</button>
          <button type="button" onClick={handleRestore} data-testid="btn-restore" style={settingBtnStyle}>Restore Data</button>
          {!confirmClear ? (
            <button type="button" onClick={handleClearAll} data-testid="btn-clear" style={{ ...settingBtnStyle, color: RED, fontSize: 12 }}>Hapus Semua Data</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: TEXT_SEC, fontSize: 12 }}>Hapus semua {getAllProjects().length} project?</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setConfirmClear(false)} style={settingBtnStyle}>Batal</button>
                <button type="button" onClick={handleClearAll} data-testid="btn-confirm-clear" style={{ ...settingBtnStyle, background: RED_LIGHT, color: RED, border: `1px solid ${RED_BORD}` }}>Hapus Semua</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Dashboard page ────────────────────────────────────────────────

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [playFilter, setPlayFilter] = useState("All");
  const [chainFilter, setChainFilter] = useState("All");
  const [timingFilter, setTimingFilter] = useState("All");
  const [activePill, setActivePill] = useState("All");
  const [showSettings, setShowSettings] = useState(false);
  const [, setLocation] = useLocation();
  const { showToast } = useToast();

  const load = useCallback(() => { setProjects(getProjects()); }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [load]);

  function handleStatusChange(id: string, newStatus: ProjectStatus) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const updated = { ...project, status: newStatus, updatedAt: new Date().toISOString() };
    updateProject(updated);
    setProjects((prev) => prev.map((p) => p.id === id ? updated : p));
    showToast(`status → ${newStatus}`);
  }

  function handleDelete(id: string) {
    deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast("project dihapus");
  }

  const allChains = Array.from(new Set(projects.flatMap((p) => p.chain))).sort();

  const filtered = sortProjects(projects).filter((p) => {
    if (activePill !== "All" && p.status !== activePill) return false;
    if (statusFilter !== "All" && p.status !== statusFilter) return false;
    if (priorityFilter !== "All" && p.priority !== priorityFilter) return false;
    if (playFilter !== "All" && p.playStatus !== playFilter) return false;
    if (chainFilter !== "All" && !p.chain.includes(chainFilter)) return false;
    if (timingFilter !== "All" && p.timingWindow !== timingFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.chain.some((c) => c.toLowerCase().includes(q)) ||
        p.category.some((c) => c.toLowerCase().includes(q)) ||
        p.source.toLowerCase().includes(q) ||
        (p.verdict ?? "").toLowerCase().includes(q) ||
        (p.timingWindow ?? "").toLowerCase().includes(q) ||
        p.ct.names.join(" ").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusPills = ["All", ...STATUS_ORDER] as const;
  const counts: Record<string, number> = {
    All: projects.length,
    Screening: projects.filter((p) => p.status === "Screening").length,
    Watchlist: projects.filter((p) => p.status === "Watchlist").length,
    "Active Play": projects.filter((p) => p.status === "Active Play").length,
    Done: projects.filter((p) => p.status === "Done").length,
    Skip: projects.filter((p) => p.status === "Skip").length,
  };

  const activeCount = projects.filter((p) => p.status === "Active Play").length;
  const watchCount  = projects.filter((p) => p.status === "Watchlist").length;
  const strongCount = projects.filter((p) => p.verdict === "Strong Play").length;
  const ignoreCount = projects.filter((p) => p.verdict === "Ignore").length;

  const filterDropdowns = [
    { value: statusFilter,   onChange: (v: string) => setStatusFilter(v),   testId: "filter-status",   options: [{ value: "All", label: "All Status" },   ...STATUS_ORDER.map((s) => ({ value: s, label: s }))] },
    { value: priorityFilter, onChange: (v: string) => setPriorityFilter(v), testId: "filter-priority", options: [{ value: "All", label: "All Priority" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }] },
    { value: playFilter,     onChange: (v: string) => setPlayFilter(v),     testId: "filter-play",     options: [{ value: "All", label: "All Play" }, { value: "Belum Ada", label: "Belum Ada" }, { value: "Aktif", label: "Aktif" }, { value: "Selesai", label: "Selesai" }, { value: "Skip", label: "Skip" }] },
    { value: timingFilter,   onChange: (v: string) => setTimingFilter(v),   testId: "filter-timing",   options: [{ value: "All", label: "All Timing" }, { value: "Now", label: "Now" }, { value: "This Week", label: "This Week" }, { value: "Monitor", label: "Monitor" }, { value: "No Rush", label: "No Rush" }] },
    { value: chainFilter,    onChange: (v: string) => setChainFilter(v),    testId: "filter-chain",    options: [{ value: "All", label: "All Chain" }, ...allChains.map((c) => ({ value: c, label: c }))] },
  ];

  const selectStyle: React.CSSProperties = {
    background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
    height: 32, width: "100%", padding: "0 24px 0 8px",
    color: TEXT_SEC, fontSize: 12, fontFamily: "'Inter', sans-serif",
    cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none",
  };

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh" }}>
      {/* ── Sticky header ─────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "8px 16px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div className="syne" style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              <span style={{ color: TEXT_PRI }}>ALPHA</span>
              <span style={{ color: RED }}>TRACK</span>
            </div>
            <div style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 2 }}>
              <span>{projects.length} total · {activeCount} active · {watchCount} watch</span>
              {strongCount > 0 && <span> · <span style={{ color: ACCENT }}>{strongCount}◈</span></span>}
              {ignoreCount > 0 && <span> · <span style={{ color: TEXT_MUTED }}>{ignoreCount}ø</span></span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
            <button type="button" onClick={() => setShowSettings(true)} data-testid="btn-settings"
              style={{ width: 36, height: 36, borderRadius: "50%", background: SURF_RAISED, border: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_MUTED }}>
              <Settings size={15} />
            </button>
            <button type="button" onClick={() => setLocation("/add")} data-testid="btn-add"
              style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 6px rgba(75,124,111,0.3)" }}>
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div className="hide-scrollbar" style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 8, paddingTop: 6 }}>
          {statusPills.map((pill) => {
            const isActive = activePill === pill;
            return (
              <button key={pill} type="button" onClick={() => { setActivePill(pill); setStatusFilter("All"); }} data-testid={`pill-${pill}`}
                style={{ background: isActive ? ACCENT : SURF_RAISED, color: isActive ? "#fff" : TEXT_SEC, border: isActive ? "1px solid transparent" : `1px solid ${BORDER}`, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: isActive ? 600 : 500, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                {pill}
                <span style={{ fontSize: 10, opacity: 0.75 }}>{counts[pill] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div style={{ paddingBottom: 8, display: "flex", flexDirection: "column", gap: 6, marginBottom: 2 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            <input
              type="search" placeholder="search name, chain, category, verdict..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              data-testid="input-search"
              style={{ width: "100%", background: SURFACE, border: `1px solid ${searchFocused ? ACCENT : BORDER}`, borderRadius: 8, height: 36, paddingLeft: 32, paddingRight: 12, color: TEXT_PRI, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", boxShadow: searchFocused ? `0 0 0 3px ${ACCENT_LIGHT}` : "none" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[filterDropdowns[0], filterDropdowns[1]].map((f) => (
              <div key={f.testId} style={{ position: "relative" }}>
                <select value={f.value} onChange={(e) => f.onChange(e.target.value)} data-testid={f.testId} style={selectStyle}>
                  {f.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown size={10} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, pointerEvents: "none" }} />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[filterDropdowns[2], filterDropdowns[4]].map((f) => (
              <div key={f.testId} style={{ position: "relative" }}>
                <select value={f.value} onChange={(e) => f.onChange(e.target.value)} data-testid={f.testId} style={selectStyle}>
                  {f.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown size={10} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, pointerEvents: "none" }} />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ position: "relative" }}>
              <select value={filterDropdowns[3].value} onChange={(e) => filterDropdowns[3].onChange(e.target.value)} data-testid={filterDropdowns[3].testId} style={selectStyle}>
                {filterDropdowns[3].options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <ChevronDown size={10} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, pointerEvents: "none" }} />
            </div>
            <div />
          </div>
        </div>
      </div>

      {/* Card list */}
      <div style={{ padding: "10px 10px 24px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 16 }}>tidak ada project</div>
            <button type="button" onClick={() => setLocation("/add")} data-testid="btn-add-empty"
              style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>
              + tambah project
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  );
}

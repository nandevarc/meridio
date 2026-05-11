import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Project, ProjectStatus, Priority, TimingWindow,
  STATUS_ORDER, STATUS_STYLES, PRIORITY_COLORS, PLAY_STATUS_COLORS,
  VERDICT_STYLES, TIMING_STYLES, scoreColor, computeQuickScore,
} from "../types";
import { getProjects, updateProject, deleteProject, saveProjects } from "../utils/storage";
import { useToast } from "../context/ToastContext";
import { STORAGE_KEY } from "../types";
import { Settings, Plus, ChevronDown, ExternalLink } from "lucide-react";

const ACCENT       = "#4B7C6F";
const ACCENT_LIGHT = "#EBF4F1";
const ACCENT_BORD  = "#A7D9CE";
const BORDER       = "#E5E7EB";
const SURFACE      = "#FFFFFF";
const SURF_RAISED  = "#F5F5F5";
const TEXT_PRI     = "#0A0A0A";
const TEXT_SEC     = "#6B7280";
const TEXT_MUTED   = "#9CA3AF";
const RED          = "#DC2626";
const RED_LIGHT    = "#FEF2F2";
const RED_BORD     = "#FECACA";

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
  if (project.builder) lines.push(`Builder: ${project.builder}`);
  if (project.ctSignal) {
    const ctPart = (project.ctCount != null && project.ctCount > 0) ? ` (${project.ctCount}×)` : "";
    lines.push(`CT Signal: ${project.ctSignal}${ctPart}`);
  }
  if (project.actionRequired) lines.push(`Play: ${project.actionRequired}`);
  if (project.playTypes.length) lines.push(`Type: ${project.playTypes.join(", ")}`);
  if (project.timingWindow) lines.push(`Timing: ${project.timingWindow}`);
  const qs = computeQuickScore(project);
  if (qs !== null) lines.push(`Score: ${qs}/25`);
  if (project.verdict) lines.push(`Verdict: ${project.verdict}`);
  if (project.website) lines.push(project.website);
  if (project.twitter) lines.push(project.twitter);
  return lines.join("\n");
}

const clamp2: React.CSSProperties = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };
const clamp1: React.CSSProperties = { display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" };

const actionBtnStyle: React.CSSProperties = {
  background: SURFACE, color: TEXT_SEC, border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: "0 14px", height: 32, fontSize: 12,
  cursor: "pointer", fontFamily: "'Inter', sans-serif",
};

interface CardProps {
  project: Project;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onDelete: (id: string) => void;
}

function ProjectCard({ project, onStatusChange, onDelete }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, setLocation] = useLocation();

  const qs = computeQuickScore(project);
  const isDimmed   = project.verdict === "Ignore" || project.status === "Skip";
  const isHighScore  = !isDimmed && qs !== null && qs >= 18;
  const isStrongPlay = !isDimmed && project.verdict === "Strong Play";
  const isActiveHigh = !isDimmed && project.status === "Active Play" && project.priority === "High";

  let cardBorder = `1px solid ${BORDER}`;
  let cardBg     = SURFACE;
  if (!isDimmed) {
    if (project.timingWindow === "Now") cardBorder = `1px solid rgba(220,38,38,0.3)`;
    if (isHighScore) { cardBg = ACCENT_LIGHT; cardBorder = `1px solid ${ACCENT_BORD}`; }
  }

  let leftBorder = "";
  const showPlayAccent = !isDimmed && (project.playStatus === "Aktif" || project.playStatus === "Segera");
  const playAccentColor = project.playStatus === "Aktif" ? ACCENT : "#D97706";
  if (!isDimmed) {
    if (isStrongPlay) leftBorder = `3px solid ${ACCENT}`;
    if (isActiveHigh) leftBorder = `3px solid ${RED}`;
    if (!isStrongPlay && !isActiveHigh && showPlayAccent) leftBorder = `3px solid ${playAccentColor}`;
  }

  const statusStyle    = STATUS_STYLES[project.status];
  const priorityColor  = PRIORITY_COLORS[project.priority];

  let nameColor = TEXT_PRI;
  if (isDimmed) nameColor = TEXT_MUTED;
  else if (isStrongPlay) nameColor = ACCENT;

  const links = [
    { key: "website", label: "web", url: project.website },
    { key: "twitter", label: "X",   url: project.twitter },
    { key: "discord", label: "discord", url: project.discord },
    { key: "telegram", label: "tg", url: project.telegram },
    { key: "github",   label: "gh", url: project.github },
  ].filter((l) => l.url);

  const actionText    = project.actionRequired || "";
  const playNotesText = project.playNotes || "";
  const showActionRow = actionText !== "" || playNotesText !== "";
  const actionRowText = actionText || playNotesText;

  const hasCTRow    = !!(project.ctSignal || (project.ctCount != null && project.ctCount > 0));
  const showPlayBadge = showPlayAccent;

  return (
    <div
      data-testid={`card-project-${project.id}`}
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 12,
        borderLeft: leftBorder || cardBorder,
        overflow: "hidden",
        opacity: isDimmed ? 0.45 : 1,
        transition: "opacity 150ms ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Clickable collapsed area */}
      <div onClick={() => setExpanded((e) => !e)} style={{ padding: "12px 14px 10px", cursor: "pointer", userSelect: "none" }}>
        {/* Row 1: priority dot + timing badge + name + verdict badge + chevron + status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7, gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
            <div
              className={isActiveHigh ? "pulse-red" : ""}
              style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColor, flexShrink: 0 }}
            />
            {project.timingWindow && TIMING_STYLES[project.timingWindow] && (
              <span
                className={project.timingWindow === "Now" ? "pulse-red" : ""}
                style={{ background: TIMING_STYLES[project.timingWindow].bg, color: TIMING_STYLES[project.timingWindow].text, border: `1px solid ${TIMING_STYLES[project.timingWindow].border}`, borderRadius: 999, padding: "1px 7px", fontSize: 10, flexShrink: 0 }}
              >
                {project.timingWindow}
              </span>
            )}
            {isHighScore && (
              <span style={{ color: ACCENT, fontSize: 12, flexShrink: 0 }}>◈</span>
            )}
            <span
              className="syne"
              style={{ color: nameColor, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 1 }}
            >
              {project.name}
            </span>
            {project.verdict && VERDICT_STYLES[project.verdict] && (
              <span style={{ background: VERDICT_STYLES[project.verdict].bg, color: VERDICT_STYLES[project.verdict].text, border: `1px solid ${VERDICT_STYLES[project.verdict].border}`, borderRadius: 999, padding: "1px 7px", fontSize: 10, flexShrink: 0, whiteSpace: "nowrap" }}>
                {project.verdict}
              </span>
            )}
          </div>
          <span style={{ color: TEXT_MUTED, flexShrink: 0, marginRight: 4, display: "flex", alignItems: "center", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}>
            <ChevronDown size={12} />
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
              <span key={c} style={{ background: SURF_RAISED, color: TEXT_MUTED, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>{c}</span>
            ))}
            {project.category.map((c) => (
              <span key={c} style={{ background: "#EFF6FF", color: "#2563EB", border: `1px solid #BFDBFE`, borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>{c}</span>
            ))}
            {project.stage.map((s) => (
              <span key={s} style={{ background: SURF_RAISED, color: TEXT_MUTED, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>{s}</span>
            ))}
          </div>
        )}

        {/* Row 3 — CT + play badge + score */}
        {(hasCTRow || showPlayBadge || qs !== null) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {hasCTRow && (
              <span style={{ fontSize: 12, color: TEXT_SEC, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>
                <span style={{ color: TEXT_MUTED }}>CT </span>
                {project.ctSignal}
                {project.ctCount != null && project.ctCount > 0 && (
                  <span> · <span style={{ color: RED }}>{project.ctCount}×</span></span>
                )}
                {!project.ctSignal && project.ctCount != null && project.ctCount > 0 && (
                  <span><span style={{ color: RED }}>{project.ctCount}×</span> mentioned</span>
                )}
              </span>
            )}
            {showPlayBadge && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: PLAY_STATUS_COLORS[project.playStatus], display: "inline-block" }} />
                <span style={{ color: PLAY_STATUS_COLORS[project.playStatus] }}>{project.playStatus}</span>
              </span>
            )}
            {qs !== null && (
              <span style={{ fontSize: 11, color: scoreColor(qs), fontWeight: 600, marginLeft: "auto" }}>score {qs}/25</span>
            )}
          </div>
        )}
      </div>

      {/* Action required row — always visible */}
      {showActionRow && (
        <div
          onClick={() => setExpanded((e) => !e)}
          style={{ background: ACCENT_LIGHT, borderTop: `1px solid ${BORDER}`, borderRadius: expanded ? "0" : "0 0 12px 12px", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <span style={{ color: ACCENT, fontSize: 13, flexShrink: 0 }}>→</span>
          <span style={{ color: TEXT_SEC, fontSize: 12, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {actionRowText}
          </span>
        </div>
      )}

      {/* Expanded content — animated drawer */}
      <div style={{ background: "#F9FAFB", borderTop: expanded ? `1px solid ${BORDER}` : "none", borderRadius: "0 0 12px 12px", maxHeight: expanded ? 1000 : 0, overflow: "hidden", opacity: expanded ? 1 : 0, transition: "max-height 200ms ease-out, opacity 150ms ease-out" }}>
        <div style={{ height: 4, width: "100%", background: "linear-gradient(to bottom, #F0F0F0, #F9FAFB)", flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 14px 14px" }}>
          {project.description && (
            <div>
              <span style={{ color: TEXT_MUTED, fontSize: 11 }}>desc </span>
              <span style={{ color: TEXT_SEC, fontSize: 12, ...clamp2 }}>{project.description}</span>
              {project.description.length > 120 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setLocation(`/project/${project.id}`); }} style={{ background: "none", border: "none", color: ACCENT, fontSize: 11, cursor: "pointer", padding: "0 0 0 4px" }}>
                  lihat semua →
                </button>
              )}
            </div>
          )}
          {project.narrative && (
            <div>
              <span style={{ color: TEXT_MUTED, fontSize: 11 }}>narrative </span>
              <span style={{ color: TEXT_SEC, fontSize: 12, ...clamp2 }}>{project.narrative}</span>
              {project.narrative.length > 120 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setLocation(`/project/${project.id}`); }} style={{ background: "none", border: "none", color: ACCENT, fontSize: 11, cursor: "pointer", padding: "0 0 0 4px" }}>
                  lihat semua →
                </button>
              )}
            </div>
          )}
          {project.builder && (
            <div>
              <span style={{ color: TEXT_MUTED, fontSize: 11 }}>builder </span>
              <span style={{ color: TEXT_SEC, fontSize: 12, ...clamp1 }}>{project.builder}</span>
            </div>
          )}
          {project.playTypes.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {project.playTypes.map((pt) => (
                <span key={pt} style={{ background: ACCENT_LIGHT, color: ACCENT, border: `1px solid ${ACCENT_BORD}`, borderRadius: 6, padding: "2px 10px", fontSize: 11 }}>{pt}</span>
              ))}
            </div>
          )}
          {project.playNotes && (
            <div>
              <span style={{ color: TEXT_MUTED, fontSize: 11 }}>play notes </span>
              <span style={{ color: TEXT_SEC, fontSize: 12 }}>{project.playNotes}</span>
            </div>
          )}
          {qs !== null && (
            <div style={{ color: scoreColor(qs), fontSize: 12, fontWeight: 600 }}>score {qs}/25</div>
          )}
          {project.source && (
            <div>
              <span style={{ color: TEXT_MUTED, fontSize: 11 }}>source </span>
              <span style={{ color: TEXT_SEC, fontSize: 12 }}>{project.source}</span>
            </div>
          )}
          {project.reasonToDrop && (project.verdict === "Ignore" || project.status === "Skip") && (
            <div>
              <span style={{ color: RED, fontSize: 11 }}>kill signal </span>
              <span style={{ color: "rgba(220,38,38,0.8)", fontSize: 12 }}>{project.reasonToDrop}</span>
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
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <button type="button" onClick={(e) => { e.stopPropagation(); const t = generateShareText(project); navigator.clipboard?.writeText(t).catch(() => {}); alert(t); }} data-testid={`btn-share-${project.id}`} style={actionBtnStyle}>share</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setLocation(`/project/${project.id}/edit`); }} data-testid={`btn-edit-${project.id}`} style={actionBtnStyle}>edit</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setLocation(`/project/${project.id}`); }} data-testid={`btn-detail-${project.id}`} style={actionBtnStyle}>detail</button>
            {!confirmDelete ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} data-testid={`btn-hapus-${project.id}`} style={{ ...actionBtnStyle, background: RED_LIGHT, color: RED, border: `1px solid ${RED_BORD}` }}>hapus</button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                <span style={{ color: TEXT_SEC, fontSize: 11 }}>Hapus {project.name}?</span>
                <button type="button" onClick={() => setConfirmDelete(false)} style={actionBtnStyle} data-testid={`btn-batal-${project.id}`}>Batal</button>
                <button type="button" onClick={() => onDelete(project.id)} data-testid={`btn-confirm-hapus-${project.id}`} style={{ ...actionBtnStyle, background: RED_LIGHT, color: RED, border: `1px solid ${RED_BORD}` }}>Hapus</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const settingBtnStyle: React.CSSProperties = {
  background: SURF_RAISED, color: TEXT_SEC, border: `1px solid ${BORDER}`,
  borderRadius: 10, padding: "12px 16px", fontSize: 13,
  cursor: "pointer", fontFamily: "'Inter', sans-serif", textAlign: "left", transition: "all 150ms ease",
};

function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  function handleBackup() {
    const data = localStorage.getItem(STORAGE_KEY) || "[]";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alphatrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          if (!Array.isArray(parsed)) throw new Error("invalid");
          saveProjects(parsed);
          showToast(`data diimport · ${parsed.length} project`);
          onClose();
          window.location.reload();
        } catch { alert("File tidak valid."); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handleClearAll() {
    if (!confirmClear) { setConfirmClear(true); return; }
    localStorage.removeItem(STORAGE_KEY);
    showToast("semua data dihapus");
    onClose();
    window.location.reload();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px 16px 0 0", padding: 24, zIndex: 101, maxWidth: 480, margin: "0 auto", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ color: TEXT_MUTED, fontSize: 11, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Settings</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button type="button" onClick={handleBackup} data-testid="btn-backup" style={settingBtnStyle}>Backup Data (JSON)</button>
          <button type="button" onClick={handleRestore} data-testid="btn-restore" style={settingBtnStyle}>Restore Data</button>
          {!confirmClear ? (
            <button type="button" onClick={handleClearAll} data-testid="btn-clear" style={{ ...settingBtnStyle, color: RED, fontSize: 12 }}>Hapus Semua Data</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: TEXT_SEC, fontSize: 12 }}>Hapus semua {getProjects().length} project?</span>
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

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
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
        (p.reasonToDrop ?? "").toLowerCase().includes(q) ||
        (p.timingWindow ?? "").toLowerCase().includes(q)
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

  const activeCount  = projects.filter((p) => p.status === "Active Play").length;
  const watchCount   = projects.filter((p) => p.status === "Watchlist").length;
  const strongCount  = projects.filter((p) => p.verdict === "Strong Play").length;
  const ignoreCount  = projects.filter((p) => p.verdict === "Ignore").length;

  const filterDropdowns = [
    { value: statusFilter,   onChange: (v: string) => setStatusFilter(v),   testId: "filter-status",   options: [{ value: "All", label: "All Status" },   ...STATUS_ORDER.map((s) => ({ value: s, label: s }))] },
    { value: priorityFilter, onChange: (v: string) => setPriorityFilter(v), testId: "filter-priority", options: [{ value: "All", label: "All Priority" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }] },
    { value: playFilter,     onChange: (v: string) => setPlayFilter(v),     testId: "filter-play",     options: [{ value: "All", label: "All Play" }, { value: "Belum Ada", label: "Belum Ada" }, { value: "Segera", label: "Segera" }, { value: "Aktif", label: "Aktif" }, { value: "Selesai", label: "Selesai" }] },
    { value: timingFilter,   onChange: (v: string) => setTimingFilter(v),   testId: "filter-timing",   options: [{ value: "All", label: "All Timing" }, { value: "Now", label: "Now" }, { value: "This Week", label: "This Week" }, { value: "Monitor", label: "Monitor" }, { value: "No Rush", label: "No Rush" }] },
    { value: chainFilter,    onChange: (v: string) => setChainFilter(v),    testId: "filter-chain",    options: [{ value: "All", label: "All Chain" }, ...allChains.map((c) => ({ value: c, label: c }))] },
  ];

  const selectStyle: React.CSSProperties = {
    background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
    height: 36, width: "100%", padding: "0 28px 0 10px",
    color: TEXT_SEC, fontSize: 12, fontFamily: "'Inter', sans-serif",
    cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  };

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh" }}>
      {/* Sticky Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "12px 16px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 2 }}>
          <div>
            <div className="syne" style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              <span style={{ color: TEXT_PRI }}>ALPHA</span>
              <span style={{ color: RED }}>TRACK</span>
            </div>
            <div style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 3 }}>
              <span>{projects.length} total · {activeCount} active · {watchCount} watch</span>
              {strongCount > 0 && (
                <span> · <span style={{ color: ACCENT }}>{strongCount}◈</span></span>
              )}
              {ignoreCount > 0 && (
                <span> · <span style={{ color: TEXT_MUTED }}>{ignoreCount}ø</span></span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setShowSettings(true)} data-testid="btn-settings" style={{ width: 36, height: 36, borderRadius: "50%", background: SURF_RAISED, border: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_MUTED }}>
              <Settings size={16} />
            </button>
            <button type="button" onClick={() => setLocation("/add")} data-testid="btn-add" style={{ width: 40, height: 40, borderRadius: "50%", background: ACCENT, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 8px rgba(75,124,111,0.3)" }}>
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div className="hide-scrollbar" style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 10, paddingTop: 8 }}>
          {statusPills.map((pill) => (
            <button key={pill} type="button" onClick={() => { setActivePill(pill); setStatusFilter("All"); }} data-testid={`pill-${pill}`} style={{ background: activePill === pill ? ACCENT : SURF_RAISED, color: activePill === pill ? "#fff" : TEXT_MUTED, border: `1px solid ${activePill === pill ? ACCENT : BORDER}`, borderRadius: 999, padding: "4px 12px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
              {pill}
              <span style={{ background: activePill === pill ? "rgba(255,255,255,0.25)" : "#F0F0F0", borderRadius: 999, padding: "1px 6px", fontSize: 10 }}>{counts[pill] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ paddingBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Search */}
          <input
            type="search"
            placeholder="search name, chain, category, verdict..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
            style={{ width: "100%", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, height: 40, padding: "0 12px", color: TEXT_PRI, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }}
          />
          {/* Row 1: Status + Priority */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[filterDropdowns[0], filterDropdowns[1]].map((f) => (
              <div key={f.testId} style={{ position: "relative" }}>
                <select value={f.value} onChange={(e) => f.onChange(e.target.value)} data-testid={f.testId} style={selectStyle}>
                  {f.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, pointerEvents: "none" }} />
              </div>
            ))}
          </div>
          {/* Row 2: Play + Chain */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[filterDropdowns[2], filterDropdowns[4]].map((f) => (
              <div key={f.testId} style={{ position: "relative" }}>
                <select value={f.value} onChange={(e) => f.onChange(e.target.value)} data-testid={f.testId} style={selectStyle}>
                  {f.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, pointerEvents: "none" }} />
              </div>
            ))}
          </div>
          {/* Row 3: Timing — HALF WIDTH (left column only) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <select value={filterDropdowns[3].value} onChange={(e) => filterDropdowns[3].onChange(e.target.value)} data-testid={filterDropdowns[3].testId} style={selectStyle}>
                {filterDropdowns[3].options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED, pointerEvents: "none" }} />
            </div>
            <div />
          </div>
        </div>
      </div>

      {/* Card list */}
      <div style={{ padding: "12px 12px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 16 }}>tidak ada project</div>
            <button type="button" onClick={() => setLocation("/add")} data-testid="btn-add-empty" style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>
              + tambah project
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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

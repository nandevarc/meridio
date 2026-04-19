import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Project, ProjectStatus, Priority, PlayStatus, STATUS_ORDER, STATUS_STYLES, PRIORITY_COLORS, PLAY_STATUS_COLORS } from "../types";
import { getProjects, updateProject, deleteProject, saveProjects, formatDate, formatDateTime } from "../utils/storage";
import { useToast } from "../context/ToastContext";
import { STORAGE_KEY } from "../types";
import { Settings, Plus, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Select } from "../components/FormFields";

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

interface CardProps {
  project: Project;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onDelete: (id: string) => void;
}

function ProjectCard({ project, onStatusChange, onDelete }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, setLocation] = useLocation();

  const statusStyle = STATUS_STYLES[project.status];
  const priorityColor = PRIORITY_COLORS[project.priority];
  const playStatusColor = PLAY_STATUS_COLORS[project.playStatus];
  const showPlayAccent = project.playStatus === "Aktif" || project.playStatus === "Segera";
  const accentColor = project.playStatus === "Aktif" ? "var(--emerald)" : "var(--amber)";

  function handleShare() {
    const lines: string[] = [];
    lines.push(`◈ ${project.name.toUpperCase()}`);
    const meta = [
      ...(project.chain.length ? project.chain : []),
      ...(project.category.length ? project.category : []),
      ...(project.stage.length ? project.stage : []),
    ].join(" · ");
    if (meta) lines.push(meta);
    const desc = project.narrative || project.description;
    if (desc) lines.push(desc);
    if (project.builder) lines.push(`Builder: ${project.builder}`);
    if (project.ctSignal) lines.push(`CT Signal: ${project.ctSignal}`);
    if (project.actionRequired) lines.push(`Play: ${project.actionRequired}`);
    if (project.playTypes.length) lines.push(`Type: ${project.playTypes.join(", ")}`);
    if (project.quickScore != null) lines.push(`Score: ${project.quickScore}/25`);
    if (project.website) lines.push(project.website);
    if (project.twitter) lines.push(project.twitter);

    const text = lines.join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
    alert(text);
  }

  const links = [
    { key: "website", label: "web", url: project.website },
    { key: "twitter", label: "X", url: project.twitter },
    { key: "discord", label: "discord", url: project.discord },
    { key: "telegram", label: "tg", url: project.telegram },
    { key: "github", label: "gh", url: project.github },
  ].filter((l) => l.url);

  return (
    <div
      data-testid={`card-project-${project.id}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        borderLeft: showPlayAccent ? `3px solid ${accentColor}` : "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Collapsed header */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          padding: "12px 14px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Row 1 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: priorityColor,
                flexShrink: 0,
              }}
            />
            <span
              className="syne"
              style={{
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {project.name}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const next = cycleStatus(project.status);
              onStatusChange(project.id, next);
            }}
            data-testid={`status-badge-${project.id}`}
            style={{
              background: statusStyle.bg,
              color: statusStyle.text,
              border: `1px solid ${statusStyle.border}`,
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {project.status}
          </button>
        </div>

        {/* Row 2 — tags */}
        {(project.chain.length > 0 || project.category.length > 0 || project.stage.length > 0) && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            {project.chain.map((c) => (
              <span key={c} style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>{c}</span>
            ))}
            {project.category.map((c) => (
              <span key={c} style={{ background: "#1e293b", color: "#64748b", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>{c}</span>
            ))}
            {project.stage.map((s) => (
              <span key={s} style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>{s}</span>
            ))}
          </div>
        )}

        {/* Row 3 */}
        {(project.ctSignal || showPlayAccent) && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {project.ctSignal && (
              <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                <span style={{ color: "var(--text-muted)" }}>CT </span>{project.ctSignal}
              </span>
            )}
            {showPlayAccent && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: playStatusColor, display: "inline-block" }} />
                <span style={{ color: playStatusColor }}>{project.playStatus}</span>
                {project.actionRequired && (
                  <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                    {project.actionRequired}
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {project.description && (
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>desc </span>
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{project.description}</span>
              </div>
            )}
            {project.narrative && (
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>narrative </span>
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{project.narrative}</span>
              </div>
            )}
            {project.builder && (
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>builder </span>
                <span style={{ color: "var(--text-secondary)", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>{project.builder}</span>
              </div>
            )}
            {project.playTypes.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {project.playTypes.map((pt) => (
                  <span key={pt} style={{ background: "var(--emerald-dim)", color: "var(--emerald)", borderRadius: 999, padding: "2px 10px", fontSize: 11 }}>{pt}</span>
                ))}
              </div>
            )}
            {project.playNotes && (
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>play notes </span>
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{project.playNotes}</span>
              </div>
            )}
            {project.quickScore != null && (
              <div style={{ color: "var(--red)", fontSize: 12 }}>score {project.quickScore}/25</div>
            )}
            {project.source && (
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>source </span>
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{project.source}</span>
              </div>
            )}
            {links.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {links.map((l) => (
                  <a
                    key={l.key}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`link-${l.key}-${project.id}`}
                    style={{
                      color: "var(--blue)",
                      fontSize: 11,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <ExternalLink size={10} />
                    {l.label}
                  </a>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleShare()}
                data-testid={`btn-share-${project.id}`}
                style={actionBtnStyle}
              >
                share
              </button>
              <button
                type="button"
                onClick={() => setLocation(`/project/${project.id}/edit`)}
                data-testid={`btn-edit-${project.id}`}
                style={actionBtnStyle}
              >
                edit
              </button>
              <button
                type="button"
                onClick={() => setLocation(`/project/${project.id}`)}
                data-testid={`btn-detail-${project.id}`}
                style={actionBtnStyle}
              >
                detail
              </button>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  data-testid={`btn-hapus-${project.id}`}
                  style={{
                    ...actionBtnStyle,
                    background: "var(--red-dim)",
                    color: "var(--red)",
                    border: "1px solid #991b1b",
                  }}
                >
                  hapus
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>Hapus {project.name}?</span>
                  <button type="button" onClick={() => setConfirmDelete(false)} style={actionBtnStyle} data-testid={`btn-batal-${project.id}`}>Batal</button>
                  <button
                    type="button"
                    onClick={() => onDelete(project.id)}
                    data-testid={`btn-confirm-hapus-${project.id}`}
                    style={{ ...actionBtnStyle, background: "var(--red-dim)", color: "var(--red)", border: "1px solid #991b1b" }}
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "0 16px",
  height: 36,
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace",
  minWidth: 44,
};

function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  function handleBackup() {
    const data = localStorage.getItem(STORAGE_KEY) || "[]";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `alphatrack-backup-${date}.json`;
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
        } catch {
          alert("File tidak valid.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handleClearAll() {
    const projects = getProjects();
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    showToast("semua data dihapus");
    onClose();
    window.location.reload();
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 100,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px 16px 0 0",
          padding: 24,
          zIndex: 101,
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>Settings</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button type="button" onClick={handleBackup} data-testid="btn-backup" style={{ ...settingBtnStyle }}>
            Backup Data (JSON)
          </button>
          <button type="button" onClick={handleRestore} data-testid="btn-restore" style={{ ...settingBtnStyle }}>
            Restore Data
          </button>
          {!confirmClear ? (
            <button type="button" onClick={handleClearAll} data-testid="btn-clear" style={{ ...settingBtnStyle, color: "var(--red)", fontSize: 12 }}>
              Hapus Semua Data
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>Hapus semua {getProjects().length} project?</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setConfirmClear(false)} style={settingBtnStyle}>Batal</button>
                <button type="button" onClick={handleClearAll} data-testid="btn-confirm-clear" style={{ ...settingBtnStyle, background: "var(--red-dim)", color: "var(--red)", border: "1px solid #991b1b" }}>
                  Hapus Semua
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const settingBtnStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "12px 16px",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace",
  textAlign: "left",
  transition: "all 150ms ease",
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [playFilter, setPlayFilter] = useState("All");
  const [chainFilter, setChainFilter] = useState("All");
  const [activePill, setActivePill] = useState("All");
  const [showSettings, setShowSettings] = useState(false);
  const [, setLocation] = useLocation();
  const { showToast } = useToast();

  const load = useCallback(() => {
    setProjects(getProjects());
  }, []);

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
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.chain.some((c) => c.toLowerCase().includes(q)) ||
        p.category.some((c) => c.toLowerCase().includes(q)) ||
        p.source.toLowerCase().includes(q)
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
  const watchCount = projects.filter((p) => p.status === "Watchlist").length;

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      {/* Sticky Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px 0",
        }}
      >
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div
              className="syne"
              style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              <span style={{ color: "var(--text-primary)" }}>ALPHA</span>
              <span style={{ color: "var(--red)" }}>TRACK</span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>
              {projects.length} total · {activeCount} active · {watchCount} watch
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              data-testid="btn-settings"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <Settings size={16} />
            </button>
            <button
              type="button"
              onClick={() => setLocation("/add")}
              data-testid="btn-add"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--red)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 22,
                fontWeight: 300,
              }}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div
          className="hide-scrollbar"
          style={{
            overflowX: "auto",
            display: "flex",
            gap: 6,
            paddingBottom: 10,
            paddingTop: 8,
          }}
        >
          {statusPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => {
                setActivePill(pill);
                setStatusFilter("All");
              }}
              data-testid={`pill-${pill}`}
              style={{
                background: activePill === pill ? "var(--red)" : "var(--bg-elevated)",
                color: activePill === pill ? "#fff" : "var(--text-muted)",
                border: `1px solid ${activePill === pill ? "var(--red)" : "var(--border)"}`,
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "'IBM Plex Mono', monospace",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {pill}
              <span
                style={{
                  background: activePill === pill ? "rgba(255,255,255,0.2)" : "var(--bg-base)",
                  borderRadius: 999,
                  padding: "1px 6px",
                  fontSize: 10,
                }}
              >
                {counts[pill] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ paddingBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="search"
            placeholder="search name, chain, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
            style={{
              width: "100%",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              height: 40,
              padding: "0 12px",
              color: "var(--text-primary)",
              fontSize: 13,
              fontFamily: "'IBM Plex Mono', monospace",
              outline: "none",
            }}
          />
          <div
            className="hide-scrollbar"
            style={{ overflowX: "auto", display: "flex", gap: 8 }}
          >
            {[
              {
                value: statusFilter,
                onChange: (v: string) => setStatusFilter(v),
                options: [
                  { value: "All", label: "All Status" },
                  ...STATUS_ORDER.map((s) => ({ value: s, label: s })),
                ],
                testId: "filter-status",
              },
              {
                value: priorityFilter,
                onChange: (v: string) => setPriorityFilter(v),
                options: [
                  { value: "All", label: "All Priority" },
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" },
                ],
                testId: "filter-priority",
              },
              {
                value: playFilter,
                onChange: (v: string) => setPlayFilter(v),
                options: [
                  { value: "All", label: "All Play" },
                  { value: "Belum Ada", label: "Belum Ada" },
                  { value: "Segera", label: "Segera" },
                  { value: "Aktif", label: "Aktif" },
                  { value: "Selesai", label: "Selesai" },
                ],
                testId: "filter-play",
              },
              {
                value: chainFilter,
                onChange: (v: string) => setChainFilter(v),
                options: [
                  { value: "All", label: "All Chain" },
                  ...allChains.map((c) => ({ value: c, label: c })),
                ],
                testId: "filter-chain",
              },
            ].map((f) => (
              <div key={f.testId} style={{ position: "relative", flexShrink: 0 }}>
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  data-testid={f.testId}
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    height: 36,
                    padding: "0 32px 0 12px",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    fontFamily: "'IBM Plex Mono', monospace",
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none",
                    WebkitAppearance: "none",
                  }}
                >
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: "var(--bg-elevated)" }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card list */}
      <div style={{ padding: "12px 12px 80px", display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>tidak ada project</div>
            <button
              type="button"
              onClick={() => setLocation("/add")}
              data-testid="btn-add-empty"
              style={{
                background: "var(--red)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px 24px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              + tambah project
            </button>
          </div>
        ) : (
          filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  );
}

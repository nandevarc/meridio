import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ProjectStatus, Priority, PlayStatus, Conviction,
  PLAY_TYPES,
} from "../types";
import type { Project, ProjectLinks, ProjectCT, ProjectScores } from "../types/project";
import { getProject, formatDateTime } from "../utils/storage";
import { saveProject } from "../lib/storage";
import { useToast } from "../context/ToastContext";
import { TagInput, MultiSelectTags } from "../components/TagInput";
import { Field, TextInput, TextArea, Select } from "../components/FormFields";
import { ScoreInput } from "../components/ScoreInput";
import { VerdictPicker, TimingPicker } from "./AddProject";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

const ACCENT     = "#4B7C6F";
const BORDER     = "#E5E7EB";
const SURFACE    = "#FFFFFF";
const SURF_RAISED = "#F5F5F5";
const TEXT_PRI   = "#0A0A0A";
const TEXT_MUTED = "#9CA3AF";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "12px 0", color: TEXT_MUTED, fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>
        <span>// {title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div style={{ paddingBottom: 12 }}>{children}</div>}
      <div style={{ borderBottom: `1px solid ${BORDER}` }} />
    </div>
  );
}

interface Props { id: string; }

export default function EditProject({ id }: Props) {
  const [, setLocation] = useLocation();
  const { showToast } = useToast();
  const [form, setForm] = useState<Project | null>(null);

  useEffect(() => {
    const p = getProject(id);
    if (p) setForm(p);
  }, [id]);

  if (!form) {
    return (
      <div style={{ background: "#FAFAFA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: TEXT_MUTED }}>project tidak ditemukan</div>
      </div>
    );
  }

  function set<K extends keyof Project>(key: K, value: Project[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }
  function setLink(key: keyof ProjectLinks, value: string) {
    setForm((prev) => prev ? { ...prev, links: { ...prev.links, [key]: value } } : prev);
  }
  function setScore(key: keyof ProjectScores, value: number) {
    setForm((prev) => prev ? { ...prev, scores: { ...prev.scores, [key]: value } } : prev);
  }
  function setCT(update: Partial<ProjectCT>) {
    setForm((prev) => prev ? { ...prev, ct: { ...prev.ct, ...update } } : prev);
  }

  function handleSave() {
    if (!form) return;
    if (!form.name.trim()) { alert("Nama project wajib diisi."); return; }
    saveProject({ ...form, name: form.name.trim() });
    showToast("project disimpan");
    setLocation(`/project/${id}`);
  }

  const dateInputStyle: React.CSSProperties = {
    background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
    padding: "0 12px", color: TEXT_PRI, fontSize: 14,
    fontFamily: "'Inter', sans-serif", width: "100%", outline: "none",
    height: 40, boxSizing: "border-box",
  };

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <button type="button" onClick={() => setLocation(`/project/${id}`)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, display: "flex", alignItems: "center", padding: 4 }} data-testid="btn-back">
          <ArrowLeft size={18} />
        </button>
        <span className="syne" style={{ fontWeight: 800, fontSize: 16, color: TEXT_PRI }}>Edit Project</span>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <Section title="01. Core Data">
          <Field label="Nama Project *"><TextInput value={form.name} onChange={(v) => set("name", v)} placeholder="Nama project..." autoFocus data-testid="input-name" /></Field>
          <Field label="Category"><TagInput tags={form.category} onChange={(v) => set("category", v)} placeholder="DeFi, L2, NFT..." /></Field>
          <Field label="Chain"><TagInput tags={form.chain} onChange={(v) => set("chain", v)} placeholder="Ethereum, Solana..." /></Field>
          <Field label="Stage"><TagInput tags={form.stage} onChange={(v) => set("stage", v)} placeholder="Testnet, Mainnet..." /></Field>
          <Field label="Find Date">
            <input type="date" value={form.findDate.slice(0, 10)} onChange={(e) => set("findDate", e.target.value)} data-testid="input-find-date" style={dateInputStyle} />
          </Field>
          <Field label="Source"><TextInput value={form.source} onChange={(v) => set("source", v)} placeholder="dari mana kamu dapat project ini?" data-testid="input-source" /></Field>
        </Section>

        <Section title="02. Links">
          <Field label="Website"><TextInput value={form.links.website} onChange={(v) => setLink("website", v)} type="url" placeholder="https://..." data-testid="input-website" /></Field>
          <Field label="Twitter / X"><TextInput value={form.links.twitter} onChange={(v) => setLink("twitter", v)} type="url" placeholder="https://x.com/..." data-testid="input-twitter" /></Field>
          <Field label="Discord"><TextInput value={form.links.discord} onChange={(v) => setLink("discord", v)} type="url" placeholder="https://discord.gg/..." data-testid="input-discord" /></Field>
          <Field label="Telegram"><TextInput value={form.links.telegram} onChange={(v) => setLink("telegram", v)} type="url" placeholder="https://t.me/..." data-testid="input-telegram" /></Field>
          <Field label="Github"><TextInput value={form.links.github} onChange={(v) => setLink("github", v)} type="url" placeholder="https://github.com/..." data-testid="input-github" /></Field>
        </Section>

        <Section title="03. Analysis">
          <Field label="Description"><TextArea value={form.description} onChange={(v) => set("description", v)} rows={3} placeholder="Deskripsi singkat..." data-testid="input-description" /></Field>
          <Field label="Narrative"><TextArea value={form.narrative} onChange={(v) => set("narrative", v)} rows={2} placeholder="Narrative / thesis..." data-testid="input-narrative" /></Field>
          <Field label="Builder & Team">
            <TagInput tags={form.builders} onChange={(v) => set("builders", v)} placeholder="@handle, nama builder..." />
          </Field>
          <Field label="CT Names">
            <TagInput tags={form.ct.names} onChange={(names) => setCT({ names })} placeholder="Guar Emperor, JG, Bitman..." />
          </Field>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: TEXT_MUTED, fontSize: 11, display: "block", marginBottom: 2, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase" }}>CT Count</label>
            <div style={{ color: TEXT_MUTED, fontSize: 11, marginBottom: 6 }}>berapa CT yang follow atau mention project ini</div>
            <input type="number" min={0} max={999} value={form.ct.count || ""} onChange={(e) => setCT({ count: e.target.value === "" ? 0 : Number(e.target.value) })} placeholder="0" data-testid="input-ct-count" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0 12px", color: TEXT_PRI, fontSize: 14, fontFamily: "'Inter', sans-serif", width: "100%", outline: "none", height: 40, boxSizing: "border-box" }} />
          </div>
          <Field label="Conviction">
            <Select value={form.conviction ?? "Medium"} onChange={(v) => set("conviction", v as Conviction)} options={["Low", "Medium", "High"].map((s) => ({ value: s, label: s }))} data-testid="select-conviction" />
          </Field>
          <Field label="Score Breakdown">
            <ScoreInput scores={form.scores} ctCount={form.ct.count} onChange={setScore} />
          </Field>
          <Field label="Decision Note"><TextArea value={form.decisionNote} onChange={(v) => set("decisionNote", v)} rows={2} placeholder="Catatan keputusan..." data-testid="input-decision-note" /></Field>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: TEXT_MUTED, fontSize: 11, display: "block", marginBottom: 2, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase" }}>Bias Check</label>
            <div style={{ color: TEXT_MUTED, fontSize: 11, marginBottom: 6 }}>kenapa ini bisa salah?</div>
            <TextArea value={form.biasCheck} onChange={(v) => set("biasCheck", v)} rows={2} placeholder="red flag yang saya abaikan? kenapa ini bisa fail?" data-testid="input-bias-check" />
          </div>
        </Section>

        <Section title="04. Play">
          <Field label="Jenis Play"><MultiSelectTags options={PLAY_TYPES} selected={form.playType} onChange={(v) => set("playType", v)} /></Field>
          <Field label="Play Status">
            <Select value={form.playStatus} onChange={(v) => set("playStatus", v as PlayStatus)} options={["Belum Ada", "Aktif", "Selesai", "Skip"].map((s) => ({ value: s, label: s }))} data-testid="select-play-status" />
          </Field>
          <Field label="Action Required"><TextInput value={form.actionRequired} onChange={(v) => set("actionRequired", v)} placeholder="Apa yang harus dilakukan?" data-testid="input-action-required" /></Field>
          <Field label="Play Notes"><TextArea value={form.playNotes} onChange={(v) => set("playNotes", v)} rows={2} placeholder="Catatan play..." data-testid="input-play-notes" /></Field>
        </Section>

        <Section title="05. Tracking">
          <Field label="Status">
            <Select value={form.status} onChange={(v) => set("status", v as ProjectStatus)} options={["Screening", "Watchlist", "Active Play", "Done", "Skip"].map((s) => ({ value: s, label: s }))} data-testid="select-status" />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(v) => set("priority", v as Priority)} options={["Low", "Medium", "High"].map((s) => ({ value: s, label: s }))} data-testid="select-priority" />
          </Field>
          <Field label="Verdict">
            <VerdictPicker value={form.verdict} onChange={(v) => set("verdict", v)} />
          </Field>
          <Field label="Timing Window">
            <TimingPicker value={form.timingWindow} onChange={(v) => set("timingWindow", v)} />
          </Field>
        </Section>

        <div style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 16, textAlign: "center" }}>
          Last Updated: {formatDateTime(form.updatedAt)}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: 16, zIndex: 30, maxWidth: 480, margin: "0 auto", boxSizing: "border-box", width: "100%", boxShadow: "0 -2px 8px rgba(0,0,0,0.06)" }}>
        <button type="button" onClick={handleSave} data-testid="btn-simpan" style={{ width: "100%", height: 48, background: ACCENT, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(75,124,111,0.25)" }}>Simpan</button>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button type="button" onClick={() => setLocation(`/project/${id}`)} data-testid="btn-batal" style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 13 }}>Batal</button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import {
  ProjectStatus, Priority, PlayStatus, Conviction, Verdict, TimingWindow,
  PLAY_TYPES, VERDICT_STYLES, TIMING_STYLES,
} from "../types";
import type { ProjectLinks, ProjectCT, ProjectScores } from "../types/project";
import { createEmptyProject } from "../lib/projectFactory";
import { saveProject } from "../lib/storage";
import { useToast } from "../context/ToastContext";
import { TagInput, MultiSelectTags } from "../components/TagInput";
import { Field, TextInput, TextArea, Select } from "../components/FormFields";
import { ScoreInput } from "../components/ScoreInput";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

const ACCENT       = "#4B7C6F";
const ACCENT_LIGHT = "#EBF4F1";
const ACCENT_BORD  = "#A7D9CE";
const BORDER       = "#E5E7EB";
const SURFACE      = "#FFFFFF";
const SURF_RAISED  = "#F5F5F5";
const TEXT_MUTED   = "#9CA3AF";
const TEXT_PRI     = "#0A0A0A";

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

interface VerdictPickerProps {
  value: Verdict | null;
  onChange: (v: Verdict | null) => void;
  small?: boolean;
}

export function VerdictPicker({ value, onChange, small }: VerdictPickerProps) {
  const verdicts: Verdict[] = ["Strong Play", "Watch", "Ignore"];
  const h = small ? 36 : 44;
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {verdicts.map((v) => {
        const isSelected = value === v;
        const s = VERDICT_STYLES[v];
        return (
          <button key={v} type="button" onClick={() => onChange(isSelected ? null : v)} data-testid={`verdict-${v}`} style={{ flex: 1, height: h, borderRadius: 8, border: `1px solid ${isSelected ? s.border : BORDER}`, background: isSelected ? s.bg : SURF_RAISED, color: isSelected ? s.text : TEXT_MUTED, fontSize: small ? 11 : 12, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 150ms ease", fontWeight: isSelected ? 500 : 400 }}>
            {v}
          </button>
        );
      })}
    </div>
  );
}

interface TimingPickerProps {
  value: TimingWindow | null;
  onChange: (v: TimingWindow | null) => void;
}

export function TimingPicker({ value, onChange }: TimingPickerProps) {
  const options: TimingWindow[] = ["Now", "This Week", "Monitor", "No Rush"];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((v) => {
        const isSelected = value === v;
        const s = TIMING_STYLES[v];
        return (
          <button key={v} type="button" onClick={() => onChange(isSelected ? null : v)} data-testid={`timing-${v}`} style={{ flex: 1, minWidth: 70, height: 40, borderRadius: 8, border: `1px solid ${isSelected ? s.border : BORDER}`, background: isSelected ? s.bg : SURF_RAISED, color: isSelected ? s.text : TEXT_MUTED, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 150ms ease", fontWeight: isSelected ? 500 : 400 }}>
            {v}
          </button>
        );
      })}
    </div>
  );
}

const dateInputStyle: React.CSSProperties = {
  background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
  padding: "0 12px", color: TEXT_PRI, fontSize: 14,
  fontFamily: "'Inter', sans-serif", width: "100%", outline: "none",
  height: 40, boxSizing: "border-box",
};


// ── Page ─────────────────────────────────────────────────────────

export default function AddProject() {
  const [, setLocation] = useLocation();
  const { showToast } = useToast();
  const isFull = typeof window !== "undefined" && window.location.search.includes("full=true");
  const [mode, setMode] = useState<"quick" | "full">(isFull ? "full" : "quick");

  // Pre-fill name from ?name= query param (e.g. from Quick Add "Open Full Form")
  const prefillName = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("name") ?? ""
    : "";

  const [form, setForm] = useState(() => {
    const base = createEmptyProject();
    return prefillName ? { ...base, name: prefillName } : base;
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function setLink(key: keyof ProjectLinks, value: string) {
    setForm((prev) => ({ ...prev, links: { ...prev.links, [key]: value } }));
  }
  function setScore(key: keyof ProjectScores, value: number) {
    setForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: value } }));
  }
  function setCT(update: Partial<ProjectCT>) {
    setForm((prev) => ({ ...prev, ct: { ...prev.ct, ...update } }));
  }

  function doSave() {
    saveProject({ ...form, name: form.name.trim() });
    showToast("project disimpan");
    setLocation("/");
  }

  function handleSave(force = false) {
    if (!form.name.trim()) { alert("Nama project wajib diisi."); return; }
    doSave();
  }

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <button type="button" onClick={() => setLocation("/")} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, display: "flex", alignItems: "center", padding: 4 }} data-testid="btn-back">
          <ArrowLeft size={18} />
        </button>
        <span className="syne" style={{ fontWeight: 800, fontSize: 16, color: TEXT_PRI }}>Tambah Project</span>
        <div style={{ marginLeft: "auto", display: "flex", border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
          <button type="button" onClick={() => setMode("quick")} data-testid="btn-mode-quick" style={{ background: mode === "quick" ? ACCENT : SURF_RAISED, color: mode === "quick" ? "#fff" : TEXT_MUTED, border: "none", padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: mode === "quick" ? 600 : 400 }}>Mode Cepat</button>
          <button type="button" onClick={() => setMode("full")} data-testid="btn-mode-full" style={{ background: mode === "full" ? ACCENT : SURF_RAISED, color: mode === "full" ? "#fff" : TEXT_MUTED, border: "none", padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: mode === "full" ? 600 : 400 }}>Form Lengkap</button>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {mode === "quick" ? (
          <div>
            <Field label="Nama Project *">
              <TextInput value={form.name} onChange={(v) => set("name", v)} placeholder="Nama project..." autoFocus data-testid="input-name" />
            </Field>
            <Field label="Chain">
              <TagInput tags={form.chain} onChange={(v) => set("chain", v)} placeholder="e.g. Ethereum, Solana..." />
            </Field>
            <Field label="Twitter / X">
              <TextInput value={form.links.twitter} onChange={(v) => setLink("twitter", v)} placeholder="https://x.com/..." type="url" data-testid="input-twitter" />
            </Field>
            <Field label="CT Names">
              <TagInput tags={form.ct.names} onChange={(names) => setCT({ names })} placeholder="Guar Emperor, JG, Bitman..." />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(v) => set("status", v as ProjectStatus)} options={["Screening", "Watchlist", "Active Play", "Done", "Skip"].map((s) => ({ value: s, label: s }))} data-testid="select-status" />
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(v) => set("priority", v as Priority)} options={["Low", "Medium", "High"].map((s) => ({ value: s, label: s }))} data-testid="select-priority" />
            </Field>
            <Field label="Timing Window">
              <TimingPicker value={form.timingWindow} onChange={(v) => set("timingWindow", v)} />
            </Field>
            <Field label="Source">
              <TextInput value={form.source} onChange={(v) => set("source", v)} placeholder="X Scroll, CT Share, Discord..." data-testid="input-source" />
            </Field>
          </div>
        ) : (
          <div>
            <Section title="01. Core Data">
              <Field label="Nama Project *">
                <TextInput value={form.name} onChange={(v) => set("name", v)} placeholder="Nama project..." autoFocus data-testid="input-name" />
              </Field>
              <Field label="Category">
                <TagInput tags={form.category} onChange={(v) => set("category", v)} placeholder="DeFi, L2, NFT..." />
              </Field>
              <Field label="Chain">
                <TagInput tags={form.chain} onChange={(v) => set("chain", v)} placeholder="Ethereum, Solana..." />
              </Field>
              <Field label="Stage">
                <TagInput tags={form.stage} onChange={(v) => set("stage", v)} placeholder="Testnet, Mainnet..." />
              </Field>
              <Field label="Find Date">
                <input type="date" value={form.findDate} onChange={(e) => set("findDate", e.target.value)} data-testid="input-find-date" style={dateInputStyle} />
              </Field>
              <Field label="Source">
                <TextInput value={form.source} onChange={(v) => set("source", v)} placeholder="dari mana kamu dapat project ini?" data-testid="input-source" />
              </Field>
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
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: "12px 16px 20px", zIndex: 30, maxWidth: 480, margin: "0 auto", boxSizing: "border-box", width: "100%", boxShadow: "0 -2px 8px rgba(0,0,0,0.06)" }}>
        <button type="button" onClick={() => handleSave(false)} data-testid="btn-simpan" style={{ width: "100%", height: 48, background: ACCENT, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(75,124,111,0.25)" }}>Simpan</button>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button type="button" onClick={() => setLocation("/")} data-testid="btn-batal" style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 13 }}>Batal</button>
        </div>
      </div>
    </div>
  );
}

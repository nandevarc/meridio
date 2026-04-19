import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Project, ProjectStatus, Priority, PlayStatus, Conviction, PLAY_TYPES } from "../types";
import { getProject, updateProject, formatDateTime } from "../utils/storage";
import { useToast } from "../context/ToastContext";
import { TagInput, MultiSelectTags } from "../components/TagInput";
import { Field, TextInput, TextArea, Select, NumberInput } from "../components/FormFields";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "12px 0",
          color: "var(--text-muted)",
          fontSize: 11,
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        <span>// {title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div style={{ paddingBottom: 12 }}>
          {children}
        </div>
      )}
      <div style={{ borderBottom: "1px solid var(--border)" }} />
    </div>
  );
}

interface Props {
  id: string;
}

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
      <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)" }}>project tidak ditemukan</div>
      </div>
    );
  }

  function set<K extends keyof Project>(key: K, value: Project[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function handleSave() {
    if (!form) return;
    if (!form.name?.trim()) {
      alert("Nama project wajib diisi.");
      return;
    }
    const updated: Project = {
      ...form,
      name: form.name.trim(),
      updatedAt: new Date().toISOString(),
    };
    updateProject(updated);
    showToast("project disimpan");
    setLocation(`/project/${id}`);
  }

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", paddingBottom: 120 }}>
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => setLocation(`/project/${id}`)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4 }}
          data-testid="btn-back"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="syne" style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>
          Edit Project
        </span>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
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
            <input
              type="date"
              value={form.findDate.slice(0, 10)}
              onChange={(e) => set("findDate", e.target.value)}
              data-testid="input-find-date"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "var(--text-primary)",
                fontSize: 13,
                fontFamily: "'IBM Plex Mono', monospace",
                width: "100%",
                outline: "none",
                minHeight: 44,
                colorScheme: "dark",
              }}
            />
          </Field>
          <Field label="Source">
            <TextInput value={form.source} onChange={(v) => set("source", v)} placeholder="dari mana kamu dapat project ini?" data-testid="input-source" />
          </Field>
        </Section>

        <Section title="02. Links">
          <Field label="Website">
            <TextInput value={form.website} onChange={(v) => set("website", v)} type="url" placeholder="https://..." data-testid="input-website" />
          </Field>
          <Field label="Twitter / X">
            <TextInput value={form.twitter} onChange={(v) => set("twitter", v)} type="url" placeholder="https://x.com/..." data-testid="input-twitter" />
          </Field>
          <Field label="Discord">
            <TextInput value={form.discord} onChange={(v) => set("discord", v)} type="url" placeholder="https://discord.gg/..." data-testid="input-discord" />
          </Field>
          <Field label="Telegram">
            <TextInput value={form.telegram} onChange={(v) => set("telegram", v)} type="url" placeholder="https://t.me/..." data-testid="input-telegram" />
          </Field>
          <Field label="Github">
            <TextInput value={form.github} onChange={(v) => set("github", v)} type="url" placeholder="https://github.com/..." data-testid="input-github" />
          </Field>
        </Section>

        <Section title="03. Analysis">
          <Field label="Description">
            <TextArea value={form.description} onChange={(v) => set("description", v)} rows={3} placeholder="Deskripsi singkat..." data-testid="input-description" />
          </Field>
          <Field label="Narrative">
            <TextArea value={form.narrative} onChange={(v) => set("narrative", v)} rows={2} placeholder="Narrative / thesis..." data-testid="input-narrative" />
          </Field>
          <Field label="Builder & Team">
            <TextArea value={form.builder} onChange={(v) => set("builder", v)} rows={2} placeholder="nama: @handle, afiliasi: ..." data-testid="input-builder" />
          </Field>
          <Field label="CT Signal">
            <TextInput value={form.ctSignal} onChange={(v) => set("ctSignal", v)} placeholder="Guar Emperor, JG, Bitman..." data-testid="input-ct-signal" />
          </Field>
          <Field label="Conviction">
            <Select
              value={form.conviction}
              onChange={(v) => set("conviction", v as Conviction)}
              options={["Low", "Medium", "High"].map((s) => ({ value: s, label: s }))}
              data-testid="select-conviction"
            />
          </Field>
          <Field label="Quick Score (0-25)">
            <NumberInput value={form.quickScore} onChange={(v) => set("quickScore", v)} min={0} max={25} placeholder="0-25" data-testid="input-quick-score" />
          </Field>
          <Field label="Decision Note">
            <TextArea value={form.decisionNote} onChange={(v) => set("decisionNote", v)} rows={2} placeholder="Catatan keputusan..." data-testid="input-decision-note" />
          </Field>
        </Section>

        <Section title="04. Play">
          <Field label="Jenis Play">
            <MultiSelectTags options={PLAY_TYPES} selected={form.playTypes} onChange={(v) => set("playTypes", v)} />
          </Field>
          <Field label="Play Status">
            <Select
              value={form.playStatus}
              onChange={(v) => set("playStatus", v as PlayStatus)}
              options={["Belum Ada", "Segera", "Aktif", "Selesai"].map((s) => ({ value: s, label: s }))}
              data-testid="select-play-status"
            />
          </Field>
          <Field label="Action Required">
            <TextInput value={form.actionRequired} onChange={(v) => set("actionRequired", v)} placeholder="Apa yang harus dilakukan?" data-testid="input-action-required" />
          </Field>
          <Field label="Play Notes">
            <TextArea value={form.playNotes} onChange={(v) => set("playNotes", v)} rows={2} placeholder="Catatan play..." data-testid="input-play-notes" />
          </Field>
        </Section>

        <Section title="05. Tracking">
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => set("status", v as ProjectStatus)}
              options={["Screening", "Watchlist", "Active Play", "Done", "Skip"].map((s) => ({ value: s, label: s }))}
              data-testid="select-status"
            />
          </Field>
          <Field label="Priority">
            <Select
              value={form.priority}
              onChange={(v) => set("priority", v as Priority)}
              options={["Low", "Medium", "High"].map((s) => ({ value: s, label: s }))}
              data-testid="select-priority"
            />
          </Field>
        </Section>

        <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 16, textAlign: "center" }}>
          Last Updated: {formatDateTime(form.updatedAt)}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--bg-base)",
          borderTop: "1px solid var(--border)",
          padding: 16,
          zIndex: 30,
          maxWidth: 480,
          margin: "0 auto",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          data-testid="btn-simpan"
          style={{
            width: "100%",
            height: 48,
            background: "var(--red)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Simpan
        </button>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setLocation(`/project/${id}`)}
            data-testid="btn-batal"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 12,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

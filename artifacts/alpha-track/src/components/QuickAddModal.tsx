import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { TimingWindow, TIMING_STYLES } from "../types";
import { createEmptyProject } from "../lib/projectFactory";
import { saveProject } from "../lib/storage";
import { checkDuplicate, type DuplicateResult } from "../lib/duplicateDetection";
import { useToast } from "../context/ToastContext";
import { TagInput } from "./TagInput";

const ACCENT       = "#4B7C6F";
const ACCENT_LIGHT = "#EBF4F1";
const BORDER       = "#D1D5DB";
const BORDER_SUB   = "#E5E7EB";
const SURFACE      = "#FFFFFF";
const SURF_RAISED  = "#F3F4F6";
const TEXT_PRI     = "#111827";
const TEXT_SEC     = "#4B5563";
const TEXT_MUTED   = "#6B7280";

const labelStyle: React.CSSProperties = {
  color: TEXT_MUTED,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  height: 40,
  padding: "0 12px",
  width: "100%",
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  color: TEXT_PRI,
  outline: "none",
  boxSizing: "border-box",
};

interface TimingButtonsProps {
  value: TimingWindow | null;
  onChange: (v: TimingWindow | null) => void;
}

function TimingButtons({ value, onChange }: TimingButtonsProps) {
  const options: TimingWindow[] = ["Now", "This Week", "Monitor", "No Rush"];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((v) => {
        const isSelected = value === v;
        const s = TIMING_STYLES[v];
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(isSelected ? null : v)}
            style={{
              flex: 1,
              minWidth: 70,
              height: 40,
              borderRadius: 8,
              border: `1px solid ${isSelected ? s.border : BORDER}`,
              background: isSelected ? s.bg : SURF_RAISED,
              color: isSelected ? s.text : TEXT_MUTED,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 150ms ease",
              fontWeight: isSelected ? 500 : 400,
            }}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

interface QuickAddModalProps {
  onClose: () => void;
  onSuccess: (newId: string) => void;
}

export function QuickAddModal({ onClose, onSuccess }: QuickAddModalProps) {
  const [, setLocation] = useLocation();
  const { showToast } = useToast();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName]           = useState("");
  const [chain, setChain]         = useState<string[]>([]);
  const [category, setCategory]   = useState<string[]>([]);
  const [stage, setStage]         = useState<string[]>([]);
  const [source, setSource]       = useState("");
  const [twitter, setTwitter]     = useState("");
  const [website, setWebsite]     = useState("");
  const [timing, setTiming]       = useState<TimingWindow | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateResult | null>(null);
  const [validErr, setValidErr]   = useState(false);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  function doSave() {
    const base = createEmptyProject();
    const project = {
      ...base,
      name: name.trim(),
      chain,
      category,
      stage,
      source,
      links: { ...base.links, twitter, website },
      timingWindow: timing,
    };
    saveProject(project);
    showToast("project disimpan");
    onSuccess(project.id);
    onClose();
  }

  function handleSave(force = false) {
    setValidErr(false);
    if (!name.trim() || chain.length === 0 || category.length === 0) {
      setValidErr(true);
      return;
    }
    if (!force) {
      const dup = checkDuplicate(name, chain);
      if (dup) {
        setDuplicate(dup);
        return;
      }
    }
    doSave();
  }

  function handleOpenFull() {
    onClose();
    const q = name.trim() ? `?name=${encodeURIComponent(name.trim())}` : "";
    setLocation(`/add${q}`);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 200,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          background: SURFACE,
          borderRadius: "16px 16px 0 0",
          maxHeight: "85vh",
          overflowY: "auto",
          zIndex: 201,
          maxWidth: 480,
          margin: "0 auto",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.14)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 0", position: "relative" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRI }}>Quick Add</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>Capture first, research later</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute", top: 20, right: 20,
              background: "none", border: "none", cursor: "pointer",
              color: TEXT_MUTED, fontSize: 20, lineHeight: 1,
              width: 28, height: 28, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 1. Project Name */}
          <div>
            <label style={labelStyle}>
              Project Name <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setDuplicate(null); setValidErr(false); }}
              placeholder="e.g. Miden, Netrun..."
              style={{
                ...inputStyle,
                borderColor: validErr && !name.trim() ? "#EF4444" : BORDER,
              }}
              data-testid="quickadd-name"
            />
            {validErr && !name.trim() && (
              <div style={{ color: "#EF4444", fontSize: 11, marginTop: 3 }}>Project name is required</div>
            )}
          </div>

          {/* 2. Chain */}
          <div>
            <label style={labelStyle}>
              Chain <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <TagInput
              tags={chain}
              onChange={(v) => { setChain(v); setDuplicate(null); setValidErr(false); }}
              placeholder="e.g. Ethereum, Solana..."
            />
            {validErr && chain.length === 0 && (
              <div style={{ color: "#EF4444", fontSize: 11, marginTop: 3 }}>At least one chain required</div>
            )}
          </div>

          {/* 3. Category */}
          <div>
            <label style={labelStyle}>
              Category <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <TagInput
              tags={category}
              onChange={(v) => { setCategory(v); setValidErr(false); }}
              placeholder="e.g. DeFi, L2, NFT..."
            />
            {validErr && category.length === 0 && (
              <div style={{ color: "#EF4444", fontSize: 11, marginTop: 3 }}>At least one category required</div>
            )}
          </div>

          {/* 4. Stage */}
          <div>
            <label style={{ ...labelStyle, color: TEXT_MUTED + "aa" }}>Stage &mdash; optional</label>
            <TagInput
              tags={stage}
              onChange={setStage}
              placeholder="e.g. Testnet, Mainnet..."
            />
          </div>

          {/* 5. Source */}
          <div>
            <label style={{ ...labelStyle, color: TEXT_MUTED + "aa" }}>Source &mdash; optional</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Twitter, Discord, CT mention..."
              style={inputStyle}
              data-testid="quickadd-source"
            />
          </div>

          {/* 6. Twitter + Website inline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ ...labelStyle, color: TEXT_MUTED + "aa" }}>Twitter</label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://x.com/..."
                style={inputStyle}
                data-testid="quickadd-twitter"
              />
            </div>
            <div>
              <label style={{ ...labelStyle, color: TEXT_MUTED + "aa" }}>Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
                data-testid="quickadd-website"
              />
            </div>
          </div>

          {/* 7. Timing Window */}
          <div>
            <label style={{ ...labelStyle, color: TEXT_MUTED + "aa" }}>Timing &mdash; optional</label>
            <TimingButtons value={timing} onChange={setTiming} />
          </div>

          {/* Duplicate warning */}
          {duplicate && (
            <div
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ color: "#F59E0B", fontSize: 14 }}>⚠</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#92400E" }}>
                  Possible duplicate found
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#B45309", marginBottom: 12 }}>
                "{duplicate.matchedProject.name}" on{" "}
                {duplicate.matchedProject.chain.join(", ")} already exists. Save anyway?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => doSave()}
                  data-testid="quickadd-save-anyway"
                  style={{
                    background: "#F59E0B", color: "#fff",
                    height: 32, padding: "0 16px",
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: "none", cursor: "pointer",
                  }}
                >
                  Save anyway
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicate(null)}
                  data-testid="quickadd-cancel-dup"
                  style={{
                    background: SURFACE, color: "#B45309",
                    border: "1px solid #FDE68A",
                    height: 32, padding: "0 16px",
                    borderRadius: 8, fontSize: 12, fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => handleSave(false)}
            data-testid="quickadd-save"
            style={{
              width: "100%", height: 44,
              background: ACCENT, color: "#fff",
              border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Inter', sans-serif",
              boxShadow: "0 2px 8px rgba(75,124,111,0.25)",
            }}
          >
            Save to Screening
          </button>
          <button
            type="button"
            onClick={handleOpenFull}
            data-testid="quickadd-open-full"
            style={{
              width: "100%", height: 40,
              background: SURFACE, color: TEXT_SEC,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}
          >
            Open Full Form instead
          </button>
        </div>
      </div>
    </>
  );
}

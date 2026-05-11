import { useState, useRef } from "react";

const ACCENT       = "#4B7C6F";
const ACCENT_LIGHT = "#EBF4F1";
const ACCENT_BORD  = "#A7D9CE";
const BORDER       = "#E5E7EB";
const SURFACE      = "#FFFFFF";
const SURF_RAISED  = "#F5F5F5";
const TEXT_PRIMARY = "#0A0A0A";
const TEXT_SECOND  = "#6B7280";
const TEXT_MUTED   = "#9CA3AF";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = "Type and press Enter..." }: TagInputProps) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(val: string) {
    const trimmed = val.trim().replace(/,$/, "").trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInputVal("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(inputVal); }
    else if (e.key === "Backspace" && inputVal === "" && tags.length > 0) onChange(tags.slice(0, -1));
  }

  function removeTag(tag: string) { onChange(tags.filter((t) => t !== tag)); }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
        padding: "8px 12px", cursor: "text", minHeight: 44,
        display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            background: SURF_RAISED, color: TEXT_SECOND, border: `1px solid ${BORDER}`,
            borderRadius: 6, padding: "2px 8px", fontSize: 12,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
            data-testid={`remove-tag-${tag}`}
            style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, padding: 0, fontSize: 14, lineHeight: 1, minWidth: 16, minHeight: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef} value={inputVal} onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown} onBlur={() => { if (inputVal.trim()) addTag(inputVal); }}
        placeholder={tags.length === 0 ? placeholder : ""}
        style={{ background: "transparent", border: "none", outline: "none", color: TEXT_PRIMARY, fontSize: 14, fontFamily: "'Inter', sans-serif", flex: 1, minWidth: 120, padding: 0 }}
        data-testid="tag-input"
      />
    </div>
  );
}

interface MultiSelectTagsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelectTags({ options, selected, onChange }: MultiSelectTagsProps) {
  function toggle(option: string) {
    if (selected.includes(option)) onChange(selected.filter((s) => s !== option));
    else onChange([...selected, option]);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option} type="button" onClick={() => toggle(option)}
            data-testid={`play-type-${option}`}
            style={{
              background: isSelected ? ACCENT_LIGHT : SURF_RAISED,
              color: isSelected ? ACCENT : TEXT_MUTED,
              border: `1px solid ${isSelected ? ACCENT_BORD : BORDER}`,
              borderRadius: 6, padding: "6px 14px", fontSize: 13,
              cursor: "pointer", minHeight: 32, fontFamily: "'Inter', sans-serif",
              transition: "all 150ms ease", fontWeight: isSelected ? 500 : 400,
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

import { useState, useRef } from "react";

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
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputVal("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && inputVal === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        background: "var(--bg-input)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "8px 12px",
        cursor: "text",
        minHeight: 44,
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "2px 10px",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 0,
              fontSize: 13,
              lineHeight: 1,
              minWidth: 16,
              minHeight: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            data-testid={`remove-tag-${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (inputVal.trim()) addTag(inputVal); }}
        placeholder={tags.length === 0 ? placeholder : ""}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontSize: 13,
          fontFamily: "'IBM Plex Mono', monospace",
          flex: 1,
          minWidth: 120,
          padding: 0,
        }}
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
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            data-testid={`play-type-${option}`}
            style={{
              background: isSelected ? "var(--emerald-dim)" : "var(--bg-elevated)",
              color: isSelected ? "var(--emerald)" : "var(--text-muted)",
              border: `1px solid ${isSelected ? "var(--emerald)" : "var(--border)"}`,
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 12,
              cursor: "pointer",
              minHeight: 32,
              fontFamily: "'IBM Plex Mono', monospace",
              transition: "all 150ms ease",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

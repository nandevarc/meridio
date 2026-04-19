import { ChevronDown } from "lucide-react";

const inputStyle: React.CSSProperties = {
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
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: 11,
  display: "block",
  marginBottom: 6,
  fontFamily: "'IBM Plex Mono', monospace",
  fontWeight: 600,
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

interface TextInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  "data-testid"?: string;
}

export function TextInput({ value, onChange, placeholder, type = "text", autoFocus, "data-testid": testId }: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      data-testid={testId}
      style={inputStyle}
      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border-focus)"; }}
      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
    />
  );
}

interface TextAreaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  "data-testid"?: string;
}

export function TextArea({ value, onChange, placeholder, rows = 3, "data-testid": testId }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      data-testid={testId}
      style={{
        ...inputStyle,
        resize: "vertical",
        minHeight: rows * 28,
      }}
      onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--border-focus)"; }}
      onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--border)"; }}
    />
  );
}

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  "data-testid"?: string;
}

export function Select({ value, onChange, options, "data-testid": testId }: SelectProps) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        style={{
          ...inputStyle,
          paddingRight: 36,
          cursor: "pointer",
        }}
        onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--border-focus)"; }}
        onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--border)"; }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

interface NumberInputProps {
  value: number | null;
  onChange: (val: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  "data-testid"?: string;
}

export function NumberInput({ value, onChange, min, max, placeholder, "data-testid": testId }: NumberInputProps) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value === "" ? null : Number(e.target.value);
        onChange(v);
      }}
      min={min}
      max={max}
      placeholder={placeholder}
      data-testid={testId}
      style={inputStyle}
      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border-focus)"; }}
      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
    />
  );
}

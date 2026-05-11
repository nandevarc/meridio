import { ChevronDown } from "lucide-react";

const A     = "#4B7C6F";
const AL    = "#EBF4F1";
const B     = "#E5E7EB";
const S     = "#FFFFFF";
const TP    = "#0A0A0A";
const TM    = "#9CA3AF";

const inputBase: React.CSSProperties = {
  background: S,
  border: `1px solid ${B}`,
  borderRadius: 8,
  padding: "0 12px",
  color: TP,
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  width: "100%",
  outline: "none",
  height: 40,
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  color: TM,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 6,
};

interface FieldProps { label: string; children: React.ReactNode; }

export function Field({ label, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

interface TextInputProps {
  value: string; onChange: (val: string) => void;
  placeholder?: string; type?: string; autoFocus?: boolean;
  "data-testid"?: string;
}

export function TextInput({ value, onChange, placeholder, type = "text", autoFocus, "data-testid": testId }: TextInputProps) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} autoFocus={autoFocus} data-testid={testId}
      style={inputBase}
      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = A; (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px ${AL}`; }}
      onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = B; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
    />
  );
}

interface TextAreaProps {
  value: string; onChange: (val: string) => void;
  placeholder?: string; rows?: number; "data-testid"?: string;
}

export function TextArea({ value, onChange, placeholder, rows = 3, "data-testid": testId }: TextAreaProps) {
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows} data-testid={testId}
      style={{ ...inputBase, height: "auto", padding: "10px 12px", resize: "none", minHeight: Math.max(80, rows * 24), lineHeight: 1.6 }}
      onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = A; (e.target as HTMLTextAreaElement).style.boxShadow = `0 0 0 3px ${AL}`; }}
      onBlur={(e)  => { (e.target as HTMLTextAreaElement).style.borderColor = B; (e.target as HTMLTextAreaElement).style.boxShadow = "none"; }}
    />
  );
}

interface SelectProps {
  value: string; onChange: (val: string) => void;
  options: { value: string; label: string }[]; "data-testid"?: string;
}

export function Select({ value, onChange, options, "data-testid": testId }: SelectProps) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        style={{ ...inputBase, paddingRight: 36, cursor: "pointer" }}
        onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = A; (e.target as HTMLSelectElement).style.boxShadow = `0 0 0 3px ${AL}`; }}
        onBlur={(e)  => { (e.target as HTMLSelectElement).style.borderColor = B; (e.target as HTMLSelectElement).style.boxShadow = "none"; }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: S, color: TP }}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: TM, pointerEvents: "none" }} />
    </div>
  );
}

interface NumberInputProps {
  value: number | null; onChange: (val: number | null) => void;
  min?: number; max?: number; placeholder?: string; "data-testid"?: string;
}

export function NumberInput({ value, onChange, min, max, placeholder, "data-testid": testId }: NumberInputProps) {
  return (
    <input
      type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      min={min} max={max} placeholder={placeholder} data-testid={testId}
      style={inputBase}
      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = A; (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px ${AL}`; }}
      onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = B; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
    />
  );
}

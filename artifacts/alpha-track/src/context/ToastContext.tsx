import { useState, useCallback, createContext, useContext } from "react";

interface Toast { id: string; message: string; exiting?: boolean; }
interface ToastContextType { showToast: (message: string) => void; }

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, 200);
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={toast.exiting ? "toast-exit" : "toast-enter"}
            style={{
              background: "#0A0A0A",
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "8px 18px",
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontWeight: 500,
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

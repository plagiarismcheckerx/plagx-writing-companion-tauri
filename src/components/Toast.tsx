import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
/** How long a toast stays open (same as the PCX app). */
const TOAST_MS = 5000;

type Kind = "error" | "success" | "info" | "confirm";
type Toast = { id: number; kind: Kind; message: string; confirmLabel?: string; resolve?: (ok: boolean) => void };
type Api = {
  error: (m: string) => void;
  success: (m: string) => void;
  info: (m: string) => void;
  /** Red toast with Cancel / confirm buttons. Resolves true only if confirmed (closing or timing out = false). */
  confirm: (m: string, confirmLabel?: string) => Promise<boolean>;
};

const Ctx = createContext<Api | null>(null);

/** `const toast = useToast(); toast.error("…")`. Toasts close after 5 s or on the × button. */
export function useToast(): Api {
  const api = useContext(Ctx);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number, ok = false) => {
    setToasts((t) => {
      t.find((x) => x.id === id)?.resolve?.(ok);
      return t.filter((x) => x.id !== id);
    });
  }, []);
  const push = useCallback((kind: Kind, message: string) => {
    // Same message already showing (e.g. a double click): don't stack it.
    setToasts((t) => (t.some((x) => x.message === message) ? t : [...t, { id: nextId++, kind, message }]));
  }, []);
  const [api] = useState<Api>(() => ({
    error: (m) => push("error", m),
    success: (m) => push("success", m),
    info: (m) => push("info", m),
    confirm: (m, confirmLabel = "Delete") =>
      new Promise<boolean>((resolve) => {
        // Only one confirm at a time; a new one cancels the previous.
        setToasts((t) => {
          t.filter((x) => x.kind === "confirm").forEach((x) => x.resolve?.(false));
          return [...t.filter((x) => x.kind !== "confirm"), { id: nextId++, kind: "confirm", message: m, confirmLabel, resolve }];
        });
      }),
  }));

  return (
    <Ctx.Provider value={api}>
      {children}
      {createPortal(
        <div className="toasts" aria-live="assertive">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={(ok) => dismiss(t.id, ok)} />
          ))}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (ok?: boolean) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(false), TOAST_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  const danger = toast.kind === "error" || toast.kind === "confirm";
  return (
    <div className={`toast ${toast.kind}`} role={danger ? "alert" : "status"}>
      <span className="toast-icon" aria-hidden>
        <svg viewBox="0 0 24 24">
          {toast.kind === "success" ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          ) : toast.kind === "confirm" ? (
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
          ) : (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d={toast.kind === "error" ? "M12 7.5v5.5M12 16.5h.01" : "M12 11v5.5M12 7.5h.01"} />
            </>
          )}
        </svg>
      </span>
      <div className="toast-body">
        <p>{toast.message}</p>
        {toast.kind === "confirm" && (
          <div className="toast-actions">
            <button className="toast-btn danger" onClick={() => onClose(true)}>
              {toast.confirmLabel}
            </button>
            <button className="toast-btn" onClick={() => onClose(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
      <button className="toast-close" onClick={() => onClose(false)} aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <span className="toast-timer" style={{ animationDuration: `${TOAST_MS}ms` }} aria-hidden />
    </div>
  );
}

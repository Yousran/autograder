"use client";
import { createContext, useContext, useState } from "react";

const SyncContext = createContext<
  | {
      saving: boolean;
      saved: boolean;
      error: string | null;
      setSaving: (value: boolean) => void;
      setSaved: (value: boolean) => void;
      setError: (error: string | null) => void;
    }
  | undefined
>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <SyncContext.Provider
      value={{ saving, setSaving, saved, setSaved, error, setError }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within a SyncProvider");
  return context;
};

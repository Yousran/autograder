"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  ReactNode,
} from "react";

// Types for sync status
export type SyncStatus = "idle" | "syncing" | "error" | "synced";

export interface PendingChange {
  id: string;
  label: string;
  status: SyncStatus;
  timestamp: number;
}

interface GlobalSyncContextType {
  // Global sync status (computed from all pending changes)
  globalStatus: SyncStatus;
  pendingChanges: PendingChange[];
  pendingCount: number;

  // Operations to track changes
  startSync: (id: string, label?: string) => void;
  markSynced: (id: string) => void;
  markError: (id: string) => void;
  clearError: (id: string) => void;

  // Helper to generate unique IDs
  generateId: () => string;
}

const GlobalSyncContext = createContext<GlobalSyncContextType | null>(null);

interface GlobalSyncProviderProps {
  children: ReactNode;
}

export function GlobalSyncProvider({ children }: GlobalSyncProviderProps) {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const idCounter = useRef(0);

  // Generate unique ID for tracking
  const generateId = useCallback(() => {
    idCounter.current += 1;
    return `sync-${Date.now()}-${idCounter.current}`;
  }, []);

  // Calculate global status from all pending changes
  const globalStatus: SyncStatus =
    pendingChanges.length === 0
      ? "idle"
      : pendingChanges.some((c) => c.status === "error")
      ? "error"
      : pendingChanges.some((c) => c.status === "syncing")
      ? "syncing"
      : "synced";

  const pendingCount = pendingChanges.filter(
    (c) => c.status === "syncing"
  ).length;

  // Start tracking a sync operation
  const startSync = useCallback((id: string, label: string = "Saving...") => {
    setPendingChanges((prev) => {
      // Update existing or add new
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        return prev.map((c) =>
          c.id === id
            ? { ...c, status: "syncing" as SyncStatus, timestamp: Date.now() }
            : c
        );
      }
      return [
        ...prev,
        { id, label, status: "syncing" as SyncStatus, timestamp: Date.now() },
      ];
    });
  }, []);

  // Mark a sync operation as completed
  const markSynced = useCallback((id: string) => {
    setPendingChanges((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "synced" as SyncStatus } : c
      )
    );
    // Auto-remove after showing "saved" briefly
    setTimeout(() => {
      setPendingChanges((prev) => prev.filter((c) => c.id !== id));
    }, 1500);
  }, []);

  // Mark a sync operation as failed
  const markError = useCallback((id: string) => {
    setPendingChanges((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "error" as SyncStatus } : c
      )
    );
  }, []);

  // Clear an error (for retry)
  const clearError = useCallback((id: string) => {
    setPendingChanges((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <GlobalSyncContext.Provider
      value={{
        globalStatus,
        pendingChanges,
        pendingCount,
        startSync,
        markSynced,
        markError,
        clearError,
        generateId,
      }}
    >
      {children}
    </GlobalSyncContext.Provider>
  );
}

export function useGlobalSync() {
  const context = useContext(GlobalSyncContext);
  if (!context) {
    throw new Error("useGlobalSync must be used within a GlobalSyncProvider");
  }
  return context;
}

// Hook for easy sync tracking with automatic ID management
export function useSyncTracker() {
  const { startSync, markSynced, markError, generateId } = useGlobalSync();
  const activeIds = useRef<Map<string, string>>(new Map());

  const trackSync = useCallback(
    async (
      key: string,
      operation: () => Promise<{ success: boolean; error?: string }>,
      label?: string
    ): Promise<{ success: boolean; error?: string }> => {
      // Use existing ID for this key or generate new one
      let id = activeIds.current.get(key);
      if (!id) {
        id = generateId();
        activeIds.current.set(key, id);
      }

      startSync(id, label);

      try {
        const result = await operation();
        if (result.success) {
          markSynced(id);
          activeIds.current.delete(key);
        } else {
          markError(id);
        }
        return result;
      } catch (error) {
        markError(id);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [startSync, markSynced, markError, generateId]
  );

  return { trackSync };
}

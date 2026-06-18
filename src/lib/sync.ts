import { create } from "zustand";
import { supabase, supabaseEnabled } from "./supabase";
import { useStore } from "@/store/useStore";
import type { AppData } from "@/types";

const TABLE = "finance_state";

/** Store keys that make up the persisted AppData (everything except `ui`). */
const DATA_KEYS = [
  "people",
  "accounts",
  "categories",
  "transactions",
  "recurring",
  "budgets",
  "goals",
  "settings",
] as const;

export type SyncPhase =
  | "offline" // no env vars — local-only mode
  | "idle" // configured but not signed in
  | "connecting"
  | "synced"
  | "saving"
  | "saved"
  | "error";

interface SyncStatus {
  phase: SyncPhase;
  lastError: string | null;
  lastSavedAt: string | null;
  set: (patch: Partial<Omit<SyncStatus, "set">>) => void;
}

export const useSyncStatus = create<SyncStatus>((set) => ({
  phase: supabaseEnabled ? "idle" : "offline",
  lastError: null,
  lastSavedAt: null,
  set: (patch) => set(patch),
}));

const status = () => useSyncStatus.getState();

/**
 * Pull the user's saved data from Supabase into the store.
 * Returns true if a remote row existed (and was loaded), false otherwise.
 * Throws on a real error so callers can surface it.
 */
export async function pullRemote(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data?.data) {
    useStore.getState().importData(data.data as AppData);
    return true;
  }
  return false;
}

/** Push the current store data up to Supabase (upsert one row per user). */
export async function pushRemote(userId: string): Promise<void> {
  if (!supabase) return;
  status().set({ phase: "saving" });
  const data = useStore.getState().exportData();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) {
    status().set({ phase: "error", lastError: error.message });
    throw new Error(error.message);
  }
  status().set({ phase: "saved", lastError: null, lastSavedAt: new Date().toISOString() });
}

let unsubscribe: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced autosave: push to Supabase ~800ms after the last data change. */
function startAutosave(userId: string) {
  stopAutosave();
  unsubscribe = useStore.subscribe((state, prev) => {
    const dataChanged = DATA_KEYS.some((k) => state[k] !== prev[k]);
    if (!dataChanged) return; // ignore UI-only updates (modals, filters)
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      pushRemote(userId).catch((e) =>
        status().set({ phase: "error", lastError: e instanceof Error ? e.message : String(e) })
      );
    }, 800);
  });
}

function stopAutosave() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
}

/**
 * Connect the store to the cloud for a signed-in user.
 * Pulls existing data; if none exists yet, seeds the cloud from current local
 * data. Then starts autosaving subsequent changes.
 */
export async function connectSync(userId: string): Promise<void> {
  status().set({ phase: "connecting", lastError: null });
  try {
    const hadRemote = await pullRemote(userId);
    if (!hadRemote) await pushRemote(userId); // first login: seed cloud from local
    startAutosave(userId);
    status().set({ phase: "synced", lastSavedAt: new Date().toISOString() });
  } catch (e) {
    status().set({ phase: "error", lastError: e instanceof Error ? e.message : String(e) });
  }
}

/** Detach autosave (e.g. on sign-out). */
export function disconnectSync(): void {
  stopAutosave();
  status().set({ phase: supabaseEnabled ? "idle" : "offline" });
}

/** Diagnostic: verify env, auth, table reachability and RLS. */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (!supabaseEnabled || !supabase)
    return { ok: false, message: "Supabase env vars are not set (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)." };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, message: "Not signed in — sign in first." };
  const { error } = await supabase
    .from(TABLE)
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) return { ok: false, message: `Query failed: ${error.message}` };
  return { ok: true, message: `Connected as ${session.user.email}. Table "${TABLE}" reachable, RLS OK.` };
}

/** Diagnostic: force-push current local data to the cloud right now. */
export async function forceSync(): Promise<{ ok: boolean; message: string }> {
  if (!supabaseEnabled || !supabase) return { ok: false, message: "Supabase not configured." };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, message: "Not signed in." };
  try {
    await pushRemote(session.user.id);
    return { ok: true, message: "Local data pushed to cloud successfully." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

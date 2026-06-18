import { supabase } from "./supabase";
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

/**
 * Pull the user's saved data from Supabase into the store.
 * Returns true if a remote row existed (and was loaded), false otherwise.
 */
export async function pullRemote(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[sync] pull failed:", error.message);
    return false;
  }
  if (data?.data) {
    useStore.getState().importData(data.data as AppData);
    return true;
  }
  return false;
}

/** Push the current store data up to Supabase (upsert one row per user). */
export async function pushRemote(userId: string): Promise<void> {
  if (!supabase) return;
  const data = useStore.getState().exportData();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) console.error("[sync] push failed:", error.message);
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
    timer = setTimeout(() => void pushRemote(userId), 800);
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
  const hadRemote = await pullRemote(userId);
  if (!hadRemote) await pushRemote(userId); // first login: seed cloud from local
  startAutosave(userId);
}

/** Detach autosave (e.g. on sign-out). */
export function disconnectSync(): void {
  stopAutosave();
}

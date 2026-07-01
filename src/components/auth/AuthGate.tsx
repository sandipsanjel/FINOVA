import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { connectSync, disconnectSync } from "@/lib/sync";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

interface AuthCtx {
  email: string | null;
  cloud: boolean; // true when running against Supabase
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ email: null, cloud: false, signOut: async () => {} });
export const useAuth = () => useContext(Ctx);

/** Wrapper: in local-only mode (no env vars) just render the app. */
export function AuthGate({ children }: { children: ReactNode }) {
  if (!supabaseEnabled || !supabase) {
    return (
      <Ctx.Provider value={{ email: null, cloud: false, signOut: async () => {} }}>
        {children}
      </Ctx.Provider>
    );
  }
  return <CloudAuthGate>{children}</CloudAuthGate>;
}

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

function CloudAuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signOutDueToInactivity = useCallback(() => {
    supabase!.auth.signOut();
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(signOutDueToInactivity, SESSION_TIMEOUT_MS);
  }, [signOutDueToInactivity]);

  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase!.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Inactivity timeout — only active while signed in
  useEffect(() => {
    if (!session) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    resetTimer();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [session, resetTimer]);

  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!userId) {
      disconnectSync();
      setSynced(false);
      return;
    }
    let cancelled = false;
    connectSync(userId).finally(() => {
      if (!cancelled) setSynced(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!ready) return <Splash text="Loading…" />;
  if (!session) return <LoginScreen />;
  if (!synced) return <Splash text="Syncing your data…" />;

  return (
    <Ctx.Provider
      value={{
        email: session.user.email ?? null,
        cloud: true,
        signOut: async () => {
          await supabase!.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

function Splash({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-xs text-slate-400">
            {mode === "signin" ? "Sign in to access your data" : "Create your account"}
          </p>
        </div>

        <div>
          <Label>Email</Label>
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}
        {notice && <p className="text-xs text-emerald-500">{notice}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError(null);
            setNotice(null);
          }}
          className="block w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}

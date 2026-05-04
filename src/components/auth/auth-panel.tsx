"use client";

import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, Mail, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthPanelProps = {
  onUserChange?: (user: User | null) => void;
};

export function AuthPanel({ onUserChange }: AuthPanelProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      onUserChange?.(null);
      return;
    }

    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setUser(data.user);
      onUserChange?.(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      onUserChange?.(nextUser);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [onUserChange, supabase]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }

    setIsLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);
    setStatus(
      error
        ? error.message
        : "Check your email for the sign-in link. Planning still works while you wait.",
    );
  }

  async function signInWithGoogle() {
    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }

    setIsLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus(error.message);
      setIsLoading(false);
    }
  }

  async function signOut() {
    if (!supabase) return;

    setIsLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signOut();
    setIsLoading(false);
    setStatus(error ? error.message : "Signed out. You can keep planning without an account.");
  }

  if (user) {
    return (
      <section className="rounded-lg border border-line bg-white/75 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-accent-strong">
              <ShieldCheck size={16} /> Signed in
            </p>
            <p className="mt-1 break-all text-sm text-muted">
              {user.email ?? "Authenticated traveler"}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold transition hover:border-accent disabled:opacity-60"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
        {status && <p className="mt-3 text-sm text-muted">{status}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white/75 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky">
          <LogIn size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold">Optional account</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            Plan without signing in. Sign in only when you want to save trips.
          </p>
        </div>
      </div>

      <form onSubmit={sendMagicLink} className="mt-4 flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Email address</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="you@example.com"
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
        >
          <Mail size={15} />
          Link
        </button>
      </form>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isLoading}
        className="mt-2 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-semibold transition hover:border-accent disabled:opacity-60"
      >
        Continue with Google
      </button>

      {status && <p className="mt-3 text-sm text-muted">{status}</p>}
    </section>
  );
}

"use client";

import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, Mail, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Language = "en" | "de";

type AuthPanelProps = {
  language?: Language;
  onUserChange?: (user: User | null) => void;
};

const text = {
  en: {
    signedIn: "Signed in",
    signIn: "Sign in",
    signOut: "Sign out",
    optional: "Optional account",
    note: "Use JourneyForge without an account. Sign in when you want to save.",
    emailPlaceholder: "you@example.com",
    magicLink: "Magic link",
    google: "Continue with Google",
    configuredError: "Supabase is not configured.",
    sent: "Check your email for the sign-in link.",
    signedOut: "Signed out. You can keep planning without an account.",
    traveler: "Authenticated traveler",
  },
  de: {
    signedIn: "Angemeldet",
    signIn: "Anmelden",
    signOut: "Abmelden",
    optional: "Optionales Konto",
    note: "JourneyForge funktioniert ohne Konto. Melde dich an, wenn du speichern willst.",
    emailPlaceholder: "du@beispiel.ch",
    magicLink: "Magic Link",
    google: "Mit Google fortfahren",
    configuredError: "Supabase ist nicht konfiguriert.",
    sent: "Pruefe deine E-Mail fuer den Anmeldelink.",
    signedOut: "Abgemeldet. Du kannst ohne Konto weiterplanen.",
    traveler: "Angemeldeter Reisender",
  },
} satisfies Record<Language, Record<string, string>>;

export function AuthPanel({ language = "en", onUserChange }: AuthPanelProps) {
  const copy = text[language];
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
      if (nextUser) {
        setIsOpen(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [onUserChange, supabase]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setStatus(copy.configuredError);
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
    setStatus(error ? error.message : copy.sent);
  }

  async function signInWithGoogle() {
    if (!supabase) {
      setStatus(copy.configuredError);
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
    setStatus(error ? error.message : copy.signedOut);
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 shadow-sm">
        <ShieldCheck size={16} className="text-accent-strong" />
        <div className="hidden min-w-0 sm:block">
          <p className="text-xs font-semibold text-accent-strong">{copy.signedIn}</p>
          <p className="max-w-44 truncate text-xs text-muted">
            {user.email ?? copy.traveler}
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={isLoading}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-line bg-white px-2 text-xs font-semibold transition hover:border-accent disabled:opacity-60"
        >
          <LogOut size={14} />
          {copy.signOut}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-semibold shadow-sm transition hover:border-accent"
      >
        <LogIn size={16} />
        {copy.signIn}
      </button>

      {isOpen && (
        <section className="absolute right-0 z-20 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-4 shadow-xl">
          <p className="text-sm font-semibold">{copy.optional}</p>
          <p className="mt-1 text-sm leading-5 text-muted">{copy.note}</p>

          <form onSubmit={sendMagicLink} className="mt-4 flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Email address</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                placeholder={copy.emailPlaceholder}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
            >
              <Mail size={15} />
              {copy.magicLink}
            </button>
          </form>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="mt-2 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-semibold transition hover:border-accent disabled:opacity-60"
          >
            {copy.google}
          </button>

          {status && <p className="mt-3 text-sm text-muted">{status}</p>}
        </section>
      )}
    </div>
  );
}


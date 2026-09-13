"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  BTN_GHOST,
  BTN_SUBMIT,
  ERROR_BANNER,
  INPUT,
  LABEL,
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  SEGMENT_TRACK,
} from "@/components/ui/styles";

type Mode = "signin" | "signup" | "magic";

const MODE_LABELS: Record<Mode, string> = {
  signin: "Sign in",
  signup: "Sign up",
  magic: "Magic link",
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleEnabled =
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH === "true";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage("Magic link sent! Check your inbox.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setMessage(
            "Account created! Check your inbox to confirm your email, then sign in."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 py-32">
      <div className="w-full max-w-sm rounded-container bg-surface p-8 shadow-extruded">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Welcome
        </h1>
        <p className="mt-1 text-sm text-muted">Sign in to your Personal OS.</p>

        <div className={`${SEGMENT_TRACK} mt-6 grid w-full grid-cols-3`}>
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setMessage(null);
              }}
              className={mode === m ? SEGMENT_ACTIVE : SEGMENT_IDLE}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className={LABEL}>Email</label>
            <input
              type="email"
              required
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT}
            />
          </div>
          {mode !== "magic" && (
            <div>
              <label className={LABEL}>Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT}
              />
            </div>
          )}
          <button type="submit" disabled={loading} className={BTN_SUBMIT}>
            {loading
              ? "Working..."
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send magic link"}
          </button>
        </form>

        {googleEnabled && (
          <>
            <div className="my-6 flex items-center gap-2 text-xs font-medium text-muted">
              <span className="h-px flex-1 bg-surface shadow-inset-sm" /> or{" "}
              <span className="h-px flex-1 bg-surface shadow-inset-sm" />
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className={BTN_GHOST + " w-full"}
            >
              Continue with Google
            </button>
          </>
        )}

        {message && (
          <p className="mt-4 rounded-btn bg-surface p-4 text-xs font-bold text-success shadow-inset-sm">
            {message}
          </p>
        )}
        {error && <p className={`${ERROR_BANNER} mt-4`}>{error}</p>}

        <p className="mt-6 text-center text-xs font-medium text-muted">
          <Link href="/" className="hover:text-ink">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

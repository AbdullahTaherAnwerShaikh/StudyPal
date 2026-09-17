"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { DEMO_COOKIE } from "@/lib/demo-cookie";
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

type Mode = "signin" | "signup";

const MODE_LABELS: Record<Mode, string> = {
  signin: "Sign in",
  signup: "Sign up",
};

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { score, label: "Weak", color: "text-danger" };
  if (score <= 4) return { score, label: "Medium", color: "text-warn" };
  return { score, label: "Strong", color: "text-success" };
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleEnabled =
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH === "true";

  const strength = passwordStrength(password);
  const passwordsMatch = mode === "signup" && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = mode === "signup" && confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = mode === "signup" ? password === confirmPassword && password.length >= 6 : true;

  function handleDemo() {
    document.cookie = `${DEMO_COOKIE}=1; path=/; SameSite=Lax`;
    router.push("/dashboard");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    try {
      if (mode === "signup") {
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
        <p className="mt-1 text-sm text-muted">Sign in to StudyPal.</p>

        <div className={`${SEGMENT_TRACK} mt-6 grid w-full grid-cols-2`}>
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setMessage(null);
                setConfirmPassword("");
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
          <div>
            <label className={LABEL}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT}
            />
            {mode === "signup" && password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength.score
                          ? strength.score <= 2
                            ? "bg-danger"
                            : strength.score <= 4
                              ? "bg-warn"
                              : "bg-success"
                          : "bg-ink/10"
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-[11px] font-bold ${strength.color}`}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>
          {mode === "signup" && (
            <div>
              <label className={LABEL}>Confirm password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${INPUT} ${
                  passwordsMatch
                    ? "ring-2 ring-success/50"
                    : passwordsMismatch
                      ? "ring-2 ring-danger/50"
                      : ""
                }`}
              />
              {passwordsMatch && (
                <p className="mt-1 text-xs font-semibold text-success">
                  Passwords match
                </p>
              )}
              {passwordsMismatch && (
                <p className="mt-1 text-xs font-semibold text-danger">
                  Passwords do not match
                </p>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className={BTN_SUBMIT}
          >
            {loading
              ? "Working..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
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

        <div className="my-6 flex items-center gap-2 text-xs font-medium text-muted">
          <span className="h-px flex-1 bg-surface shadow-inset-sm" /> or{" "}
          <span className="h-px flex-1 bg-surface shadow-inset-sm" />
        </div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-btn bg-accent/15 px-5 py-2.5 text-sm font-bold text-accent ring-1 ring-inset ring-accent/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent/20 hover:ring-accent/60 active:translate-y-0 active:shadow-inset-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.4 7.2 17l.9-5.3L4.2 7.9l5.4-.8L12 2z" strokeLinejoin="round" />
          </svg>
          Try Demo
        </button>

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
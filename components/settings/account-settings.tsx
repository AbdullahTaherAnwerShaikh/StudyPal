"use client";

import { useState, useTransition } from "react";
import {
  BTN_PRIMARY,
  FIELD_ERROR,
  INPUT,
  LABEL,
} from "@/components/ui/styles";
import {
  changeEmail,
  changePassword,
  deleteAccount,
} from "@/lib/actions/account";

const DANGER_BUTTON =
  "inline-flex items-center justify-center gap-1.5 rounded-btn bg-danger px-5 py-2.5 text-sm font-bold text-white shadow-extruded-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-extruded active:translate-y-0 active:shadow-inset-sm disabled:opacity-50 disabled:shadow-none";

function FormMessage({
  message,
  pendingEmail,
}: {
  message: string | null;
  pendingEmail?: string | null;
}) {
  if (!message) return null;
  return (
    <div className="mt-4 space-y-1">
      <p className="text-xs font-bold text-accent" aria-live="polite">
        {message}
      </p>
      {pendingEmail && (
        <p className="text-xs font-semibold text-muted">
          Confirmation sent to {pendingEmail}.
        </p>
      )}
    </div>
  );
}

function ChangeEmail({ email }: { email: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setPendingEmail(null);
    setError(null);

    const candidate = newEmail.trim().toLowerCase();
    if (candidate === email.toLowerCase()) {
      setError("That's already your current email.");
      return;
    }

    startTransition(async () => {
      const result = await changeEmail({ newEmail: candidate });
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
      } else {
        setMessage(result.message ?? "Check your inbox.");
        setPendingEmail(result.pendingEmail ?? null);
        setNewEmail("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="new-email" className={LABEL}>
          New email
        </label>
        <input
          id="new-email"
          type="email"
          required
          placeholder="you@newdomain.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className={INPUT}
        />
        <p className="mt-1 text-xs font-medium text-muted">
          We&apos;ll send a confirmation link to this address before it takes
          effect.
        </p>
      </div>
      <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
        {isPending ? "Sending\u2026" : "Update email"}
      </button>
      <FormMessage message={message} pendingEmail={pendingEmail} />
      {error && (
        <p className={`${FIELD_ERROR} mt-4`} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next === current) {
      setError("New password must be different from your current password.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }

    startTransition(async () => {
      const result = await changePassword({
        currentPassword: current,
        newPassword: next,
      });
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
      } else {
        setMessage(result.message ?? "Password updated.");
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="current-password" className={LABEL}>
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="new-password" className={LABEL}>
          New password
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className={LABEL}>
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={INPUT}
        />
      </div>
      <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
        {isPending ? "Updating\u2026" : "Update password"}
      </button>
      <FormMessage message={message} />
      {error && (
        <p className={`${FIELD_ERROR} mt-4`} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function DangerZone() {
  const [confirmText, setConfirmText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const armed = confirmText.trim().toLowerCase() === "delete";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!armed) {
      setError("Type \u201Cdelete\u201D to confirm you want to remove your account.");
      return;
    }

    startTransition(async () => {
      const result = await deleteAccount();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
      } else {
        setMessage(result.message ?? "Account deleted.");
        window.location.assign("/login");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <p className="text-xs font-semibold text-muted">
        Permanently removes your account and all your data \u2014 courses,
        topics, tasks, notes, habits, study plans, and settings. This cannot
        be undone.
      </p>
      <div>
        <label htmlFor="delete-confirm" className={LABEL}>
          Type{" "}
          <span className="font-bold text-danger">delete</span> to confirm
        </label>
        <input
          id="delete-confirm"
          type="text"
          required
          autoComplete="off"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className={INPUT}
        />
      </div>
      <button
        type="submit"
        disabled={!armed || isPending}
        className={DANGER_BUTTON}
      >
        {isPending ? "Deleting\u2026" : "Delete my account"}
      </button>
      {message && (
        <p className="text-xs font-bold text-accent" aria-live="polite">
          {message}
        </p>
      )}
      {error && (
        <p className={`${FIELD_ERROR} mt-2`} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export default function AccountSettings({
  email,
  providerLabel,
  hasPassword,
}: {
  email: string;
  providerLabel: string;
  hasPassword: boolean;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-container bg-surface p-6 shadow-extruded">
        <h2 className="font-display text-base font-bold text-ink">
          Sign-in method
        </h2>
        <p className="mt-1 text-xs font-semibold text-muted">
          How you log in to this account.
        </p>
        <p className="mt-3 rounded-btn bg-surface px-4 py-3 text-sm font-bold text-ink shadow-inset-sm">
          {providerLabel}
        </p>
      </section>

      <section className="rounded-container bg-surface p-6 shadow-extruded">
        <h2 className="font-display text-base font-bold text-ink">
          Change email
        </h2>
        <p className="mt-1 text-xs font-semibold text-muted">
          Current email: <span className="text-ink">{email}</span>
        </p>
        <ChangeEmail email={email} />
      </section>

      {hasPassword ? (
        <section className="rounded-container bg-surface p-6 shadow-extruded">
          <h2 className="font-display text-base font-bold text-ink">
            Change password
          </h2>
          <p className="mt-1 text-xs font-semibold text-muted">
            New passwords must be at least 8 characters.
          </p>
          <ChangePassword />
        </section>
      ) : (
        <section className="rounded-container bg-surface p-6 shadow-extruded">
          <h2 className="font-display text-base font-bold text-ink">
            Change password
          </h2>
          <p className="mt-3 rounded-btn bg-surface px-4 py-3 text-xs font-bold text-muted shadow-inset-sm">
            You signed in with {providerLabel}, so there&apos;s no password to
            change here. Manage it through your provider instead.
          </p>
        </section>
      )}

      <section className="rounded-container bg-surface p-6 shadow-extruded">
        <h2 className="font-display text-base font-bold text-danger">
          Danger zone
        </h2>
        <DangerZone />
      </section>
    </div>
  );
}
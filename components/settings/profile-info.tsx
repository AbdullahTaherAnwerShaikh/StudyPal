"use client";

import { useState, useTransition } from "react";
import {
  BTN_PRIMARY,
  FIELD_ERROR,
  INPUT,
  LABEL,
} from "@/components/ui/styles";
import { updateProfileInfo } from "@/lib/actions/account";

export default function ProfileInfo({
  initialDisplayName,
  initialUsername,
  memberSince,
}: {
  initialDisplayName: string;
  initialUsername: string;
  memberSince: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateProfileInfo({ displayName, username });
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
      } else {
        setMessage(result.message ?? "Profile updated.");
      }
    });
  }

  return (
    <section className="rounded-container bg-surface p-6 shadow-extruded">
      <h2 className="font-display text-base font-bold text-ink">Profile info</h2>
      {memberSince && (
        <p className="mt-1 text-xs font-semibold text-muted">
          Member since {memberSince}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="display-name" className={LABEL}>
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            required
            maxLength={60}
            placeholder="e.g. Alexandra"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="username" className={LABEL}>
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            pattern="[a-zA-Z0-9_]{3,20}"
            title="3\u201320 characters using letters, numbers, or underscores"
            placeholder="e.g. alexandra_01"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={INPUT}
          />
          <p className="mt-1 text-xs font-medium text-muted">
            3\u201320 characters, letters, numbers, and underscores only.
          </p>
        </div>
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? "Saving\u2026" : "Save changes"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-xs font-bold text-accent" aria-live="polite">
          {message}
        </p>
      )}
      {error && (
        <p className={`${FIELD_ERROR} mt-4`} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
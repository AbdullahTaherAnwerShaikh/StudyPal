"use client";

export default function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-accent/10 px-4 py-2 text-xs font-bold text-accent">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Demo Mode — changes won&apos;t be saved.{" "}
      <a href="/" className="underline underline-offset-2 hover:text-accent-light">
        Sign in
      </a>{" "}
      for a real account.
    </div>
  );
}

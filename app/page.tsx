import { BTN_GHOST, BTN_PRIMARY } from "@/components/ui/styles";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-12 px-6 py-32">
      <h1 className="text-center font-display text-5xl font-extrabold tracking-tight text-ink sm:text-6xl">
        StudyPal <span className="text-accent">Dashboard</span>
      </h1>
      <p className="text-lg text-muted">Calendar · Tasks · Notes · Habits</p>
      <div className="flex flex-wrap justify-center gap-4">
        <a href="/dashboard" className={BTN_PRIMARY}>
          Open dashboard
        </a>
        <a href="/login" className={BTN_GHOST}>
          Sign in
        </a>
      </div>
    </main>
  );
}

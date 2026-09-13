export default function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
      {children}
    </h1>
  );
}

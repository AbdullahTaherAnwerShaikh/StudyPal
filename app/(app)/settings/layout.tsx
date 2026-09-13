import type { ReactNode } from "react";
import SettingsNav from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-6xl">
        <SettingsNav />
      </div>
      {children}
    </>
  );
}
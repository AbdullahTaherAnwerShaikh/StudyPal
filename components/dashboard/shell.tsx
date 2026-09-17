"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";
import DemoBanner from "@/components/demo-banner";

export default function DashboardShell({
  email,
  demo = false,
  children,
}: {
  email: string;
  demo?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {demo && <DemoBanner />}
      <Sidebar open={open} onClose={() => setOpen(false)} demo={demo} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar email={email} onMenu={() => setOpen(true)} demo={demo} />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

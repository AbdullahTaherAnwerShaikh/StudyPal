"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  SEGMENT_TRACK,
} from "@/components/ui/styles";

const TABS = [
  { href: "/settings", label: "Appearance" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/account", label: "Account" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className={SEGMENT_TRACK} aria-label="Settings sections">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? SEGMENT_ACTIVE : SEGMENT_IDLE}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
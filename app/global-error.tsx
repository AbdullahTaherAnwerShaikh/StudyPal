"use client";

import { useEffect } from "react";
import { THEME_COOKIE, THEME_MODE_COOKIE } from "@/lib/theme";
import "./globals.css";

const THEME_INLINE_SCRIPT = `(function(){try{function getCookie(name){var m=document.cookie.match(new RegExp('(?:^|; )'+name+'=([^;]*)'));return m?decodeURIComponent(m[1]):''}var accent=getCookie(${JSON.stringify(
  THEME_COOKIE
)});var mode=getCookie(${JSON.stringify(
  THEME_MODE_COOKIE
)});if(accent)document.documentElement.setAttribute('data-theme-accent',accent);if(mode)document.documentElement.setAttribute('data-theme-mode',mode)}catch(e){}})();`;

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" data-theme-mode="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INLINE_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-surface font-sans text-ink antialiased">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-container bg-surface p-8 text-center shadow-extruded">
            <p className="text-xs font-bold uppercase tracking-wide text-danger">
              Something went wrong
            </p>
            <h1 className="mt-2 text-xl font-bold text-ink">
              We hit an unexpected error
            </h1>
            <p className="mt-2 text-sm text-muted">
              Try again to reload the app.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={retry}
                className="inline-flex min-h-[44px] items-center rounded-btn bg-accent px-4 text-xs font-bold text-white shadow-extruded-sm transition-all duration-300 ease-out hover:bg-accent-light active:shadow-inset-sm"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
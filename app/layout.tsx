import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase-server";
import {
  THEME_COOKIE,
  THEME_MODE_COOKIE,
  sanitizeTheme,
  sanitizeThemeMode,
} from "@/lib/theme";
import { LOGO_D, LOGO_VIEWBOX } from "@/lib/logo";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "StudyPal",
  description:
    "Your personal OS for studying: calendar, tasks, notes, habits, and an AI study planner.",
};

const LOGO_CONSTANTS = JSON.stringify({
  d: LOGO_D,
  viewbox: LOGO_VIEWBOX,
});

const THEME_INLINE_SCRIPT = `(function(){try{
function getCookie(name){var m=document.cookie.match(new RegExp('(?:^|; )'+name+'=([^;]*)'));return m?decodeURIComponent(m[1]):''}
var accent=getCookie(${JSON.stringify(THEME_COOKIE)});
var mode=getCookie(${JSON.stringify(THEME_MODE_COOKIE)});
if(accent)document.documentElement.setAttribute('data-theme-accent',accent);
if(mode)document.documentElement.setAttribute('data-theme-mode',mode);
var L=${LOGO_CONSTANTS};
function renderFavicon(){try{
var cs=window.getComputedStyle(document.documentElement);
function gv(n,f){var v=(cs.getPropertyValue(n)||'').trim();return v||f}
var acc=gv('--theme-accent','#6c63ff');
var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+L.viewbox+'"><path d="'+L.d+'" fill="'+acc+'"/></svg>';
var href='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
var link=document.querySelector('link[rel="icon"]');
if(!link){link=document.createElement('link');link.rel='icon';link.type='image/svg+xml';link.sizes='any';document.head.appendChild(link);}
link.href=href;
}catch(e){}}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',renderFavicon,{once:true})}else{renderFavicon()}
if(document.documentElement){new MutationObserver(renderFavicon).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme-accent','data-theme-mode']})}
}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_settings")
    .select("theme, theme_mode")
    .maybeSingle();

  const cookieStore = await cookies();
  const theme = sanitizeTheme(
    data?.theme ?? cookieStore.get(THEME_COOKIE)?.value
  );
  const themeMode = sanitizeThemeMode(
    data?.theme_mode ?? cookieStore.get(THEME_MODE_COOKIE)?.value
  );

  return (
    <html
      lang="en"
      data-theme-mode={themeMode}
      data-theme-accent={theme}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INLINE_SCRIPT }} />
      </head>
      <body
        className={`${jakarta.variable} ${dmSans.variable} min-h-screen bg-surface font-sans text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
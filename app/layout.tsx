import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { ThemeToggle } from "./theme-toggle";
import { UpdateBanner } from "./downloads/update-banner";
import { getLatestVersion } from "./lib/latest-version";
import { UserMenu } from "@/components/auth/user-menu";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Mira Browser",
  description: "An open source desktop browser that helps you get everything done.",
  keywords: [
    "FatalMistake02",
    "Fatal Mistake 02",
    "Mira-Studios",
    "Mira Studios",
    "Kolbe Tessarzik",
    "kolbe-tessarzik",
    "Mira",
    "Browser",
    "Mira Browser",
    "efficient browser",
    "open source browser",
    "open-source browser",
    "customizable browser",
    "customizable themes",
    "browser themes",
    "themeable browser",
    "desktop browser",
    "Electron browser",
    "React browser",
    "MIT licensed browser",
    "easy to use",
    "ad blocker",
    "ad-blocker",
    "browser with ad blocker",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const latestVersion = await getLatestVersion();

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin || false;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-preference"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "try{const t=localStorage.getItem('theme-preference');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch{}",
          }}
        />
        <meta name="google-site-verification" content="RwpruDDKM5uiqVPr4VkMb4f6Luwz6vx1XXBqb2HebdQ" />
      </head>
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="container nav-wrap">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Link href="/" className="brand" aria-label="Mira home">
                  <Image
                    src="/assets/mira.png"
                    alt="Mira"
                    width={140}
                    height={38}
                    className="brand-image"
                    priority
                  />
                </Link>
                <UpdateBanner latestVersion={latestVersion} settingsUrl="mira://Updates" compact />
              </div>
              <div className="nav-controls">
                <nav className="nav-links" aria-label="Primary">
                  {isAdmin && <Link href="/admin">Admin</Link>}
                  <Link href="/">Home</Link>
                  <Link href="/roadmap">Roadmap</Link>
                  <Link href="/downloads">Downloads</Link>
                  <Link href="/themes">Themes</Link>
                </nav>
                <ThemeToggle />
                <UserMenu initialUser={user} />
              </div>
            </div>
          </header>

          {children}

          <footer className="site-footer">
            <div className="container nav-wrap footer-nav-wrap">
              <p className="footer-brand">Mira Browser - MIT License - &copy; {year}</p>
              <nav className="nav-links" aria-label="Footer">
                <Link href="/">Home</Link>
                <Link href="/roadmap">Roadmap</Link>
                <Link href="/downloads">Downloads</Link>
                <Link href="/themes">Themes</Link>
                <Link href="/privacy">Privacy</Link>
                <a href="https://github.com/Mira-Studios/mira" target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                  <a
                    href="https://github.com/Mira-Studios/mira/blob/main/LICENSE"
                    target="_blank"
                    rel="noreferrer"
                  >
                    License
                  </a>
                  <Link href="/terms">Terms</Link>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

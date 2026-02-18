import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Mira Browser",
  description: "A fast, customizable desktop browser built with Electron and React.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const t=localStorage.getItem('theme-preference');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch{}",
          }}
        />
      </head>
      <body>
        <header className="site-header">
          <div className="container nav-wrap">
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
            <div className="nav-controls">
              <nav className="nav-links" aria-label="Primary">
                <Link href="/">Home</Link>
                <Link href="/downloads">Downloads</Link>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

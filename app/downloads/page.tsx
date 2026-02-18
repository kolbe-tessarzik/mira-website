import type { Metadata } from "next";
import { PrereleaseToggle } from "./prerelease-toggle";
import { DownloadCards } from "./download-cards";
import { getSiteUrl } from "@/lib/site-url";

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type GitHubRelease = {
  id: number;
  name: string;
  tag_name: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  assets: ReleaseAsset[];
};

type DownloadSlot = {
  label: string;
  platform: "windows" | "mac-arm64" | "mac-x64" | "linux";
  asset: ReleaseAsset | null;
};

const REPO_OWNER = "FatalMistake02";
const REPO_NAME = "mira";

function parseIncludePrereleases(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return value.includes("1") || value.includes("true");
  }

  return value === "1" || value === "true";
}

function isDownloadableAsset(name: string): boolean {
  const lower = name.toLowerCase();
  return [".exe", ".msi", ".dmg", ".pkg", ".zip", ".tar.gz", ".appimage", ".deb", ".rpm"].some((ext) =>
    lower.endsWith(ext),
  );
}

function isWindowsAsset(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes("win") || lower.endsWith(".exe") || lower.endsWith(".msi");
}

function isMacAsset(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("mac") ||
    lower.includes("darwin") ||
    lower.endsWith(".dmg") ||
    lower.endsWith(".pkg")
  );
}

function isLinuxAsset(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("linux") ||
    lower.endsWith(".appimage") ||
    lower.endsWith(".deb") ||
    lower.endsWith(".rpm")
  );
}

function getMacAssetArchitecture(name: string): "arm64" | "x64" | "unknown" {
  const lower = name.toLowerCase();

  if (
    /\b(arm64|aarch64)\b/.test(lower) ||
    lower.includes("apple-silicon") ||
    lower.includes("apple_silicon")
  ) {
    return "arm64";
  }

  if (/\b(x64|x86_64|amd64)\b/.test(lower) || /\bintel\b/.test(lower)) {
    return "x64";
  }

  return "unknown";
}

function isInstallerAsset(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("setup") ||
    lower.endsWith(".msi") ||
    lower.endsWith(".dmg") ||
    lower.endsWith(".pkg")
  );
}

function isPortableAsset(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("portable") ||
    lower.endsWith(".zip") ||
    lower.endsWith(".tar.gz") ||
    (lower.endsWith(".exe") && !lower.includes("setup"))
  );
}

function chooseBestAsset(assets: ReleaseAsset[], preferredTerms: string[]): ReleaseAsset | null {
  if (assets.length === 0) {
    return null;
  }

  const ranked = [...assets].sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();

    const aScore = preferredTerms.reduce(
      (score, term, idx) => (aLower.includes(term) ? score + (preferredTerms.length - idx) * 10 : score),
      0,
    );

    const bScore = preferredTerms.reduce(
      (score, term, idx) => (bLower.includes(term) ? score + (preferredTerms.length - idx) * 10 : score),
      0,
    );

    if (aScore !== bScore) {
      return bScore - aScore;
    }

    return b.size - a.size;
  });

  return ranked[0] ?? null;
}

function buildDownloadSlots(release: GitHubRelease): {
  windowsInstaller: DownloadSlot;
  windowsPortable: DownloadSlot;
  macArm64Installer: DownloadSlot;
  macArm64Portable: DownloadSlot;
  macX64Installer: DownloadSlot;
  macX64Portable: DownloadSlot;
  linuxAppImage: DownloadSlot;
  linuxDeb: DownloadSlot;
  linuxRpm: DownloadSlot;
} {
  const assets = release.assets.filter((asset) => isDownloadableAsset(asset.name));

  const windowsAssets = assets.filter((asset) => isWindowsAsset(asset.name));
  const macAssets = assets.filter((asset) => isMacAsset(asset.name));
  const linuxAssets = assets.filter((asset) => isLinuxAsset(asset.name));

  const windowsInstallerAssets = windowsAssets.filter((asset) => isInstallerAsset(asset.name));
  const windowsPortableAssets = windowsAssets.filter((asset) => isPortableAsset(asset.name));

  const macArm64Assets = macAssets.filter((asset) => getMacAssetArchitecture(asset.name) === "arm64");
  const macX64Assets = macAssets.filter((asset) => getMacAssetArchitecture(asset.name) === "x64");
  const macUnknownArchAssets = macAssets.filter(
    (asset) => getMacAssetArchitecture(asset.name) === "unknown",
  );

  const macArm64InstallerAssets = macArm64Assets.filter((asset) => isInstallerAsset(asset.name));
  const macArm64PortableAssets = macArm64Assets.filter((asset) => isPortableAsset(asset.name));
  const macX64InstallerAssets = macX64Assets.filter((asset) => isInstallerAsset(asset.name));
  const macX64PortableAssets = macX64Assets.filter((asset) => isPortableAsset(asset.name));
  const macUnknownInstallerAssets = macUnknownArchAssets.filter((asset) => isInstallerAsset(asset.name));
  const macUnknownPortableAssets = macUnknownArchAssets.filter((asset) => isPortableAsset(asset.name));
  const linuxAppImageAssets = linuxAssets.filter((asset) => asset.name.toLowerCase().endsWith(".appimage"));
  const linuxDebAssets = linuxAssets.filter((asset) => asset.name.toLowerCase().endsWith(".deb"));
  const linuxRpmAssets = linuxAssets.filter((asset) => asset.name.toLowerCase().endsWith(".rpm"));

  return {
    windowsInstaller: {
      label: "Windows Installer",
      platform: "windows",
      asset: chooseBestAsset(windowsInstallerAssets, ["setup", ".msi", ".exe"]),
    },
    windowsPortable: {
      label: "Windows Portable",
      platform: "windows",
      asset: chooseBestAsset(windowsPortableAssets, ["portable", ".exe", ".zip"]),
    },
    macArm64Installer: {
      label: "macOS (Apple Silicon) Installer",
      platform: "mac-arm64",
      asset: chooseBestAsset(
        macArm64InstallerAssets.length > 0 ? macArm64InstallerAssets : macUnknownInstallerAssets,
        ["dmg", "pkg"],
      ),
    },
    macArm64Portable: {
      label: "macOS (Apple Silicon) Portable",
      platform: "mac-arm64",
      asset: chooseBestAsset(
        macArm64PortableAssets.length > 0 ? macArm64PortableAssets : macUnknownPortableAssets,
        ["portable", ".zip", ".tar.gz"],
      ),
    },
    macX64Installer: {
      label: "macOS (Intel) Installer",
      platform: "mac-x64",
      asset: chooseBestAsset(
        macX64InstallerAssets.length > 0 ? macX64InstallerAssets : macUnknownInstallerAssets,
        ["dmg", "pkg"],
      ),
    },
    macX64Portable: {
      label: "macOS (Intel) Portable",
      platform: "mac-x64",
      asset: chooseBestAsset(
        macX64PortableAssets.length > 0 ? macX64PortableAssets : macUnknownPortableAssets,
        ["portable", ".zip", ".tar.gz"],
      ),
    },
    linuxAppImage: {
      label: "Linux AppImage",
      platform: "linux",
      asset: chooseBestAsset(linuxAppImageAssets, [".appimage"]),
    },
    linuxDeb: {
      label: "Linux .deb",
      platform: "linux",
      asset: chooseBestAsset(linuxDebAssets, [".deb"]),
    },
    linuxRpm: {
      label: "Linux .rpm",
      platform: "linux",
      asset: chooseBestAsset(linuxRpmAssets, [".rpm"]),
    },
  };
}

async function fetchReleases(): Promise<GitHubRelease[]> {
  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "mira-website",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as GitHubRelease[];
  return data.filter((release) => !release.draft);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const userIncludePrereleases = parseIncludePrereleases(resolvedSearchParams.includePrereleases);
  const shouldNoindex = userIncludePrereleases;
  const canonicalPath = "/downloads";

  return {
    title: "Download Mira Browser for Windows and macOS",
    description:
      "Download the latest Mira desktop browser builds for Windows and macOS, with installer and portable options directly from official GitHub releases.",
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: "Download Mira Browser for Windows and macOS",
      description:
        "Get official Mira downloads for Windows and macOS, including installer and portable release assets.",
      type: "website",
      url: canonicalPath,
      images: [
        {
          url: "/assets/mira_logo.png",
          alt: "Mira browser logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Download Mira Browser for Windows and macOS",
      description:
        "Get official Mira downloads for Windows and macOS, including installer and portable release assets.",
      images: ["/assets/mira_logo.png"],
    },
    robots: shouldNoindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function DownloadsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const userIncludePrereleases = parseIncludePrereleases(resolvedSearchParams.includePrereleases);

  const allReleases = await fetchReleases();
  const stableReleases = allReleases.filter((release) => !release.prerelease);

  const hasStableLatest = stableReleases.length > 0;
  const effectiveIncludePrereleases = userIncludePrereleases || !hasStableLatest;

  const selectedRelease = effectiveIncludePrereleases
    ? (allReleases[0] ?? null)
    : (stableReleases[0] ?? null);

  const slots = selectedRelease ? buildDownloadSlots(selectedRelease) : null;
  const siteUrl = getSiteUrl();
  const releaseName = selectedRelease?.name || selectedRelease?.tag_name || "Latest";
  const softwareApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Mira Browser",
    applicationCategory: "BrowserApplication",
    operatingSystem: "Windows, macOS",
    softwareVersion: selectedRelease?.tag_name,
    releaseNotes: selectedRelease?.html_url,
    downloadUrl: `${siteUrl}/downloads`,
    url: `${siteUrl}/downloads`,
    publisher: {
      "@type": "Organization",
      name: "Mira",
      url: "https://github.com/FatalMistake02/mira",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <main className="section page-enter">
      <div className="container narrow">
        <h1 className="animate-fade-up">Download Mira</h1>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
        />
        <p className="lead">Release files are loaded directly from GitHub releases.</p>

        <div className="toggle-row animate-fade-up" style={{ animationDelay: "180ms" }}>
          <span className="toggle-label">Include pre-releases</span>
          <PrereleaseToggle
            checked={effectiveIncludePrereleases}
            disabled={!hasStableLatest}
          />
        </div>

        {!hasStableLatest && (
          <p className="muted-note animate-fade-up" style={{ animationDelay: "250ms" }}>
            No stable latest release was found, so pre-releases are enabled automatically.
          </p>
        )}

        {!selectedRelease && (
          <div className="notice animate-fade-up" style={{ animationDelay: "300ms" }}>
            <p>No GitHub release is currently available.</p>
          </div>
        )}

        {selectedRelease && slots && (
          <>
            <div className="notice animate-fade-up" style={{ animationDelay: "300ms" }}>
              <p>
                Showing <strong>{releaseName}</strong> ({selectedRelease.tag_name})
                published on {formatDate(selectedRelease.published_at)}.
              </p>
              <p>
                <a href={selectedRelease.html_url} target="_blank" rel="noreferrer">
                  View release notes on GitHub
                </a>
              </p>
            </div>

            <div className="download-list">
              <DownloadCards
                slots={[
                  slots.windowsInstaller,
                  slots.windowsPortable,
                  slots.macArm64Installer,
                  slots.macArm64Portable,
                  slots.macX64Installer,
                  slots.macX64Portable,
                  slots.linuxAppImage,
                  slots.linuxDeb,
                  slots.linuxRpm,
                ]}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

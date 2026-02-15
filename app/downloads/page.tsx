import { PrereleaseToggle } from "./prerelease-toggle";

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
  return [".exe", ".msi", ".dmg", ".pkg", ".zip", ".tar.gz"].some((ext) =>
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
  macInstaller: DownloadSlot;
  macPortable: DownloadSlot;
} {
  const assets = release.assets.filter((asset) => isDownloadableAsset(asset.name));

  const windowsAssets = assets.filter((asset) => isWindowsAsset(asset.name));
  const macAssets = assets.filter((asset) => isMacAsset(asset.name));

  const windowsInstallerAssets = windowsAssets.filter((asset) => isInstallerAsset(asset.name));
  const windowsPortableAssets = windowsAssets.filter((asset) => isPortableAsset(asset.name));

  const macInstallerAssets = macAssets.filter((asset) => isInstallerAsset(asset.name));
  const macPortableAssets = macAssets.filter((asset) => isPortableAsset(asset.name));

  return {
    windowsInstaller: {
      label: "Windows Installer",
      asset: chooseBestAsset(windowsInstallerAssets, ["setup", ".msi", ".exe"]),
    },
    windowsPortable: {
      label: "Windows Portable",
      asset: chooseBestAsset(windowsPortableAssets, ["portable", ".exe", ".zip"]),
    },
    macInstaller: {
      label: "macOS Installer",
      asset: chooseBestAsset(macInstallerAssets, ["dmg", "pkg"]),
    },
    macPortable: {
      label: "macOS Portable",
      asset: chooseBestAsset(macPortableAssets, ["portable", ".zip", ".tar.gz"]),
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

  return (
    <main className="section">
      <div className="container narrow">
        <h1>Download Mira</h1>
        <p className="lead">Release files are loaded directly from GitHub releases.</p>

        <div className="toggle-row">
          <span className="toggle-label">Include pre-releases</span>
          <PrereleaseToggle
            checked={effectiveIncludePrereleases}
            disabled={!hasStableLatest}
          />
        </div>

        {!hasStableLatest && (
          <p className="muted-note">
            No stable latest release was found, so pre-releases are enabled automatically.
          </p>
        )}

        {!selectedRelease && (
          <div className="notice">
            <p>No GitHub release is currently available.</p>
          </div>
        )}

        {selectedRelease && slots && (
          <>
            <div className="notice">
              <p>
                Showing <strong>{selectedRelease.name || selectedRelease.tag_name}</strong> ({selectedRelease.tag_name})
                published on {formatDate(selectedRelease.published_at)}.
              </p>
              <p>
                <a href={selectedRelease.html_url} target="_blank" rel="noreferrer">
                  View release notes on GitHub
                </a>
              </p>
            </div>

            <div className="download-list">
              {[slots.windowsInstaller, slots.windowsPortable, slots.macInstaller, slots.macPortable].map((slot) => (
                <article key={slot.label} className="download-card">
                  <div>
                    <h2>{slot.label}</h2>
                    {slot.asset ? <code>{slot.asset.name}</code> : <p className="muted-note">Not available in this release.</p>}
                  </div>
                  {slot.asset ? (
                    <a href={slot.asset.browser_download_url} className="btn btn-primary" target="_blank" rel="noreferrer">
                      Download
                    </a>
                  ) : (
                    <span className="btn btn-ghost" aria-disabled="true">
                      Unavailable
                    </span>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

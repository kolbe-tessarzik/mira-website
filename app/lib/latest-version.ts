import { cache } from "react";

type GitHubRelease = {
  id: number;
  name: string;
  tag_name: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
};

type ParsedSemver = {
  major: number;
  minor: number;
  patch: number;
};

const REPO_OWNER = "FatalMistake02";
const REPO_NAME = "mira";

function parseSemver(value: string): ParsedSemver | null {
  const cleaned = value.trim().replace(/^v/i, "");
  const numericPrefix = cleaned.match(/^[\d.]+/)?.[0] ?? cleaned;
  const match = numericPrefix.match(/^(\d+)\.(\d+)\.(\d+)\b/);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareSemver(a: ParsedSemver, b: ParsedSemver): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function getReleaseSemver(release: GitHubRelease): ParsedSemver | null {
  return parseSemver(release.tag_name) ?? parseSemver(release.name);
}

function getLatestReleaseBySemver(releases: GitHubRelease[]): GitHubRelease | null {
  let latest: GitHubRelease | null = null;
  let latestSemver: ParsedSemver | null = null;

  for (const release of releases) {
    const semver = getReleaseSemver(release);
    if (!semver) continue;
    if (!latestSemver || compareSemver(semver, latestSemver) > 0) {
      latest = release;
      latestSemver = semver;
    }
  }

  return latest;
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

export const getLatestVersion = cache(async (): Promise<string | null> => {
  try {
    const allReleases = await fetchReleases();
    const stableReleases = allReleases.filter((release) => !release.prerelease);
    const candidateReleases = stableReleases.length > 0 ? stableReleases : allReleases;
    const latestRelease = getLatestReleaseBySemver(candidateReleases);
    
    return latestRelease?.tag_name ?? null;
  } catch {
    return null;
  }
});

import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

type GitHubRelease = {
  tag_name: string;
  prerelease: boolean;
  draft: boolean;
};

type ParsedSemver = {
  major: number;
  minor: number;
  patch: number;
};

type RoadmapItem = {
  done: boolean;
  text: string;
};

type RoadmapMilestone = {
  heading: string;
  version: ParsedSemver;
  items: RoadmapItem[];
};

type UpcomingReleasePlan = {
  nextVersionHeading: string;
  items: string[];
  sourceUrl: string | null;
  hasNextVersion: boolean;
} | null;

const REPO_OWNER = "FatalMistake02";
const REPO_NAME = "mira";
const ROADMAP_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/ROADMAP.md`;

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

function parseRoadmapMarkdown(markdown: string): RoadmapMilestone[] {
  const lines = markdown.split(/\r?\n/);
  const milestones: RoadmapMilestone[] = [];
  let current: RoadmapMilestone | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      const versionMatch = heading.match(/v?(\d+\.\d+\.\d+)\b/i);
      const version = versionMatch ? parseSemver(versionMatch[1]) : null;

      if (version) {
        current = { heading, version, items: [] };
        milestones.push(current);
      } else {
        current = null;
      }
      continue;
    }

    const taskMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch && current) {
      current.items.push({
        done: taskMatch[1].toLowerCase() === "x",
        text: taskMatch[2].trim(),
      });
    }
  }

  return milestones;
}

async function fetchCurrentStableVersion(): Promise<ParsedSemver | null> {
  const latestResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "mira-website",
    },
    next: { revalidate: 300 },
  });

  if (latestResponse.ok) {
    const latest = (await latestResponse.json()) as GitHubRelease;
    const latestVersion = parseSemver(latest.tag_name);
    if (latestVersion) {
      return latestVersion;
    }
  }

  const releasesResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=10`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "mira-website",
    },
    next: { revalidate: 300 },
  });

  if (releasesResponse.ok) {
    const releases = (await releasesResponse.json()) as GitHubRelease[];
    const stableRelease = releases.find((release) => !release.prerelease && !release.draft);

    if (stableRelease) {
      const stableVersion = parseSemver(stableRelease.tag_name);
      if (stableVersion) {
        return stableVersion;
      }
    }
  }

  const latestPageResponse = await fetch(`https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest`, {
    headers: {
      Accept: "text/html",
      "User-Agent": "mira-website",
    },
    redirect: "follow",
    next: { revalidate: 300 },
  });

  if (latestPageResponse.ok) {
    const resolvedUrl = latestPageResponse.url;
    const tagMatch = resolvedUrl.match(/\/tag\/([^/?#]+)/i);
    if (tagMatch) {
      const parsedFromUrl = parseSemver(tagMatch[1]);
      if (parsedFromUrl) {
        return parsedFromUrl;
      }
    }
  }

  return null;
}

async function fetchRoadmapMarkdown(): Promise<{ markdown: string; sourceUrl: string } | null> {
  const contentsResponse = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/ROADMAP.md?ref=main`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "mira-website",
      },
      next: { revalidate: 600 },
    },
  );

  if (contentsResponse.ok) {
    const data = (await contentsResponse.json()) as { content?: string; encoding?: string };
    if (data.encoding === "base64" && typeof data.content === "string") {
      const decoded = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
      if (decoded.trim().length > 0) {
        return {
          markdown: decoded,
          sourceUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/ROADMAP.md`,
        };
      }
    }
  }

  const rawResponse = await fetch(ROADMAP_URL, {
    headers: {
      Accept: "text/plain",
      "User-Agent": "mira-website",
    },
    next: { revalidate: 600 },
  });

  if (!rawResponse.ok) {
    return null;
  }

  const markdown = await rawResponse.text();
  if (!markdown.trim()) {
    return null;
  }

  return {
    markdown,
    sourceUrl: ROADMAP_URL,
  };
}

async function fetchUpcomingReleasePlan(): Promise<UpcomingReleasePlan> {
  try {
    const roadmap = await fetchRoadmapMarkdown();
    if (!roadmap) {
      return null;
    }

    const milestones = parseRoadmapMarkdown(roadmap.markdown).sort((a, b) =>
      compareSemver(a.version, b.version),
    );
    if (milestones.length === 0) {
      return null;
    }

    const currentVersion = await fetchCurrentStableVersion();
    let nextMilestone: RoadmapMilestone | undefined;

    if (currentVersion) {
      nextMilestone = milestones.find((milestone) => compareSemver(milestone.version, currentVersion) > 0);

      if (!nextMilestone) {
        const firstUpcomingWithWork = milestones.find((milestone) => milestone.items.some((item) => !item.done));
        if (firstUpcomingWithWork) {
          const uncheckedFallback = firstUpcomingWithWork.items
            .filter((item) => !item.done)
            .map((item) => item.text);

          return {
            nextVersionHeading: firstUpcomingWithWork.heading,
            items: uncheckedFallback.length > 0 ? uncheckedFallback : ["No tasks listed for this milestone."],
            sourceUrl: roadmap.sourceUrl,
            hasNextVersion: true,
          };
        }

        return {
          nextVersionHeading: "No newer roadmap milestone listed yet",
          items: ["ROADMAP.md currently has no version higher than the latest stable release."],
          sourceUrl: roadmap.sourceUrl,
          hasNextVersion: false,
        };
      }
    } else {
      nextMilestone = milestones.find((milestone) => milestone.items.some((item) => !item.done)) ?? milestones[0];
    }

    const uncheckedItems = nextMilestone.items.filter((item) => !item.done).map((item) => item.text);
    const items = uncheckedItems.length > 0 ? uncheckedItems : nextMilestone.items.map((item) => item.text);

    return {
      nextVersionHeading: nextMilestone.heading,
      items: items.length > 0 ? items : ["No tasks listed for this milestone."],
      sourceUrl: roadmap.sourceUrl,
      hasNextVersion: true,
    };
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Mira Roadmap",
  description: "See what is planned for upcoming Mira releases.",
  alternates: {
    canonical: `${getSiteUrl()}/roadmap`,
  },
};

export default async function RoadmapPage() {
  const upcomingPlan = await fetchUpcomingReleasePlan();

  return (
    <main className="section page-enter">
      <div className="container">
        <article className="feature-card about-roadmap-header animate-fade-in-scale" style={{ animationDelay: "120ms" }}>
          <div>
            <p className="eyebrow">Roadmap</p>
            <h1>
              {upcomingPlan
                ? upcomingPlan.hasNextVersion
                  ? `Coming in ${upcomingPlan.nextVersionHeading}`
                  : upcomingPlan.nextVersionHeading
                : "What comes next"}
            </h1>
          </div>
          {upcomingPlan?.sourceUrl && (
            <p className="muted-note about-roadmap-source">
              Source:{" "}
              <a href={upcomingPlan.sourceUrl} target="_blank" rel="noreferrer">
                ROADMAP.md on main
              </a>
            </p>
          )}
        </article>

        {upcomingPlan ? (
          <div className="about-roadmap-grid">
            {upcomingPlan.items.map((item, idx) => (
              <article
                key={item}
                className="feature-card about-roadmap-item animate-fade-up"
                style={{ animationDelay: `${180 + idx * 90}ms` }}
              >
                <p>{item}</p>
              </article>
            ))}
          </div>
        ) : (
          <article className="feature-card about-roadmap-empty animate-fade-up" style={{ animationDelay: "200ms" }}>
            <p className="muted-note">Couldn&apos;t load next release plans right now. Check back soon.</p>
          </article>
        )}
      </div>
    </main>
  );
}

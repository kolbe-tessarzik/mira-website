import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

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

type RoadmapPlan = {
  milestones: RoadmapMilestone[];
  sourceUrl: string | null;
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

async function fetchRoadmapPlan(): Promise<RoadmapPlan> {
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

    return {
      milestones,
      sourceUrl: roadmap.sourceUrl,
    };
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Mira Roadmap",
  description: "See the release roadmap for Mira as a milestone flow.",
  alternates: {
    canonical: `${getSiteUrl()}/roadmap`,
  },
};

export default async function RoadmapPage() {
  const roadmapPlan = await fetchRoadmapPlan();

  return (
    <main className="section page-enter">
      <div className="container">
        <article className="feature-card about-roadmap-header animate-fade-in-scale" style={{ animationDelay: "100ms" }}>
          <div>
            <p className="eyebrow">Roadmap</p>
            <h1>Release Flow</h1>
          </div>
          {roadmapPlan?.sourceUrl && (
            <p className="muted-note about-roadmap-source">
              Source:{" "}
              <a href={roadmapPlan.sourceUrl} target="_blank" rel="noreferrer">
                ROADMAP.md on main
              </a>
            </p>
          )}
        </article>

        {roadmapPlan ? (
          <div className="roadmap-vertical-flow">
            {roadmapPlan.milestones.map((milestone, idx) => {
              const plannedItems = milestone.items.filter((item) => !item.done).map((item) => item.text);
              const itemsToRender =
                plannedItems.length > 0 ? plannedItems : milestone.items.map((item) => item.text);

              return (
                <div key={milestone.heading} className="roadmap-version-block">
                  <article
                    className="feature-card roadmap-version-header-card animate-fade-up"
                    style={{ animationDelay: `${160 + idx * 90}ms` }}
                  >
                    <h2>{milestone.heading}</h2>
                  </article>

                  <div className="roadmap-version-items-grid">
                    {itemsToRender.map((item, itemIdx) => (
                      <article
                        key={`${milestone.heading}-${item}`}
                        className="feature-card roadmap-version-item-card animate-fade-up"
                        style={{ animationDelay: `${220 + idx * 90 + itemIdx * 70}ms` }}
                      >
                        <p>{item}</p>
                      </article>
                    ))}
                  </div>

                  {idx < roadmapPlan.milestones.length - 1 && (
                    <div className="roadmap-down-arrow" aria-hidden>
                      <svg viewBox="0 0 160 120" role="presentation">
                        <defs>
                          <linearGradient id="roadmapArrow" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#0284c7" />
                          </linearGradient>
                        </defs>
                        <path d="M80 14 L80 76" stroke="url(#roadmapArrow)" strokeWidth="9" strokeLinecap="round" />
                        <path d="M48 66 L80 100 L112 66" fill="none" stroke="url(#roadmapArrow)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <article className="feature-card about-roadmap-empty animate-fade-up" style={{ animationDelay: "180ms" }}>
            <p className="muted-note">Couldn&apos;t load roadmap data right now. Check back soon.</p>
          </article>
        )}
      </div>
    </main>
  );
}

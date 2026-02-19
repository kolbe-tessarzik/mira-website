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
  description: "See the release roadmap for Mira by version with completion status.",
  alternates: {
    canonical: `${getSiteUrl()}/roadmap`,
  },
};

export default async function RoadmapPage() {
  const roadmapPlan = await fetchRoadmapPlan();

  return (
    <main className="section page-enter">
      <div className="container narrow">
        <h1 className="animate-fade-up">Roadmap</h1>
        <p className="lead">Planned work grouped by release version.</p>

        {roadmapPlan?.sourceUrl && (
          <div className="notice animate-fade-up" style={{ animationDelay: "180ms" }}>
            <p>
              Imported from:{" "}
              <a href={roadmapPlan.sourceUrl} target="_blank" rel="noreferrer" className="roadmap-source-link">
                ROADMAP.md on GitHub
              </a>
            </p>
          </div>
        )}

        {roadmapPlan ? (
          <div className="roadmap-list">
            {roadmapPlan.milestones.map((milestone, idx) => {
              const completedCount = milestone.items.filter((item) => item.done).length;
              const totalCount = milestone.items.length;

              return (
                <article
                  key={milestone.heading}
                  className="roadmap-version-card animate-fade-up"
                  style={{ animationDelay: `${260 + idx * 90}ms` }}
                >
                  <div className="roadmap-version-card-header">
                    <h2>{milestone.heading}</h2>
                    <p className="muted-note">
                      {completedCount}/{totalCount} completed
                    </p>
                  </div>

                  {milestone.items.length > 0 ? (
                    <ul className="roadmap-items-list">
                      {milestone.items.map((item) => (
                        <li
                          key={`${milestone.heading}-${item.text}`}
                          className={`roadmap-item-row ${item.done ? "is-done" : ""}`}
                        >
                          <span className="roadmap-item-status" aria-hidden>
                            {item.done ? "✓" : ""}
                          </span>
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted-note roadmap-empty-version">No items listed for this version yet.</p>
                  )}
                </article>
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

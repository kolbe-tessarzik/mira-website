import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";

const values = [
  {
    title: "Focused Workflows",
    text: "Mira is shaped around reducing tab fatigue, making context-switching calmer, and helping you stay in flow.",
  },
  {
    title: "Built in Public",
    text: "Development is open source by default, with visible discussions, transparent roadmaps, and community pull requests.",
  },
  {
    title: "Personal by Design",
    text: "From themes to layouts, Mira treats customization as a core feature, not a premium afterthought.",
  },
];

export const metadata: Metadata = {
  title: "About Mira",
  description: "Learn what Mira is, why it exists, and where it is heading.",
  alternates: {
    canonical: `${getSiteUrl()}/about`,
  },
};

export default function AboutPage() {
  return (
    <main className="page-enter about-page">
      <section className="about-hero section">
        <div className="container">
          <p className="eyebrow animate-fade-up" style={{ animationDelay: "70ms" }}>
            About Mira
          </p>
          <h2 className="about-title animate-fade-up" style={{ animationDelay: "150ms" }}>
            A browser shaped for builders, tinkerers, and focused everyday work
          </h2>
          <p className="lead animate-fade-up" style={{ animationDelay: "240ms" }}>
            Mira exists to make desktop browsing feel fast, intentional, and deeply customizable without
            sacrificing simplicity.
          </p>
          <div className="about-actions animate-fade-up" style={{ animationDelay: "320ms" }}>
            <Link href="/downloads" className="btn btn-primary">
              Get Mira
            </Link>
            <Link href="/roadmap" className="btn btn-ghost">
              View Roadmap
            </Link>
            <a
              href="https://github.com/FatalMistake02/mira"
              className="btn btn-ghost"
              target="_blank"
              rel="noreferrer"
            >
              Explore the Repo
            </a>
          </div>
          <div className="about-orb about-orb-a" aria-hidden />
          <div className="about-orb about-orb-b" aria-hidden />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="about-section-title animate-fade-up" style={{ animationDelay: "120ms" }}>
            What guides Mira
          </h2>
          <div className="feature-grid">
            {values.map((value, idx) => (
              <article
                key={value.title}
                className="feature-card animate-fade-up"
                style={{ animationDelay: `${180 + idx * 110}ms` }}
              >
                <h2>{value.title}</h2>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

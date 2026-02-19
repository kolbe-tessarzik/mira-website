import Link from "next/link";
import { Solitreo } from "next/font/google";
import { ThemeHeroImage } from "./theme-hero-image";

const solitreo = Solitreo({
  subsets: ["latin"],
  weight: "400",
});

const highlights = [
  {
    title: "Custom Themes",
    text: "Style Mira to match your setup with customizable theming.",
  },
  {
    title: "Custom Layouts",
    text: "Choose layouts that fit how you like to browse.",
  },
  {
    title: "Built to Evolve",
    text: "Open source development keeps Mira highly customizable over time.",
  },
  {
    title: "Avoid Tracking",
    text: "Mira comes with a built-in tracker blocker so you can browse the internet safely."
  },
  {
    title: "Privacy By Default",
    text: "Mira does not collect your personal data or usage analytics.",
    href: "/privacy",
    linkLabel: "Read privacy policy",
  },
];

export default function Home() {
  return (
    <main className="page-enter">
      <section className="hero">
        <div className="container">
          <div className="hero-stack">
            <div className="hero-copy">
              <h1 className="animate-fade-up" style={{ animationDelay: "80ms" }}>
                <span className={solitreo.className} style={{ fontSize: "55px" }}>
                  mira
                </span>{" "}
                is an open source desktop browser that helps you get everything done
              </h1>
              <p className="muted-note animate-fade-up" style={{ animationDelay: "180ms" }}>
                Mira is inspired by the Japanese word mirai, meaning "future."
              </p>
              <div className="cta-row animate-fade-up" style={{ animationDelay: "280ms" }}>
                <Link href="/downloads" className="btn btn-primary">
                  Download Mira
                </Link>
                <a
                  href="https://github.com/FatalMistake02/mira"
                  className="btn btn-ghost"
                  target="_blank"
                  rel="noreferrer"
                >
                  View Source
                </a>
              </div>
            </div>
            <div
              className="hero-card hero-card--app animate-fade-in-scale"
              style={{ animationDelay: "210ms" }}
            >
              <ThemeHeroImage />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            Made To Be Customizable
          </h2>
          <div className="feature-grid">
            {highlights.map((item, idx) => (
              <article
                key={item.title}
                className="feature-card animate-fade-up"
                style={{ animationDelay: `${220 + idx * 120}ms` }}
              >
                <h2>{item.title}</h2>
                <p>{item.text}</p>
                {"href" in item && item.href ? (
                  <p>
                    <Link href={item.href} className="feature-card-link">
                      {item.linkLabel}
                    </Link>
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

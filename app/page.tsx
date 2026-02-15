import Image from "next/image";
import Link from "next/link";
import { Solitreo } from "next/font/google";

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
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>
              <span className={solitreo.className} style={{fontSize:"55px"}}>mira</span> is an open source
              desktop browser built with Electron + React.
            </h1>
            <p className="lead">
              The code is public and actively developed. Download the latest build
              or review the project source.
            </p>
            <p className="muted-note">
              Mira is inspired by the Japanese word 未来 (mirai), meaning
              “future.”
            </p>
            <div className="cta-row">
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
          <div className="hero-card">
            <Image
              src="/assets/mira_logo.png"
              alt="Mira logo"
              width={800}
              height={400}
              priority
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Made To Be Customizable</h2>
          <div className="feature-grid">
            {highlights.map((item) => (
              <article key={item.title} className="feature-card">
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

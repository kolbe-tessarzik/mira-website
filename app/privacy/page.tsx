import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Mira does not collect personal data, usage analytics, or tracking information.",
  alternates: {
    canonical: `${getSiteUrl()}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <main className="section page-enter">
      <div className="container narrow">
        <h1 className="animate-fade-up" style={{ animationDelay: "80ms" }}>Privacy</h1>

        <div className="privacy-card-stack">
          <article className="notice animate-fade-up" style={{ animationDelay: "220ms" }}>
            <p>
              We do not collect, store, sell, or share your browsing history, personal information, or usage
              analytics or any other data.
            </p>
          </article>

          <article className="feature-card animate-fade-up privacy-grid" style={{ animationDelay: "300ms" }}>
            <div className="privacy-columns">
              <section className="privacy-column">
                <h2>What We Don&apos;t Collect</h2>
                <ul className="privacy-list">
                  <li>- Personal information</li>
                  <li>- Browsing history</li>
                  <li>- Advertising identifiers</li>
                  <li>- Analytics or behavior tracking</li>
                  <li>- Everything else</li>
                </ul>
              </section>
              <section className="privacy-column">
                <h2>What We Do Collect</h2>
                <ul className="privacy-list">
                  <li>- Nothing</li>
                </ul>
              </section>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

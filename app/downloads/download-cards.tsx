"use client";

import { useEffect, useMemo, useState } from "react";

type SlotAsset = {
  name: string;
  browser_download_url: string;
};

type DownloadSlot = {
  label: string;
  platform: "windows" | "mac";
  asset: SlotAsset | null;
};

type DownloadCardsProps = {
  slots: DownloadSlot[];
};

type DetectedOS = "windows" | "mac" | "other" | "unknown";

function detectOS(): DetectedOS {
  if (typeof window === "undefined") {
    return "other";
  }

  if (process.env.NODE_ENV === "development") {
    const forced = new URLSearchParams(window.location.search).get("os")?.toLowerCase();
    if (forced === "windows" || forced === "win") {
      return "windows";
    }
    if (forced === "mac" || forced === "macos") {
      return "mac";
    }
  }

  const navigatorWithUAData = window.navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const fromUserAgentData = navigatorWithUAData.userAgentData?.platform?.toLowerCase();
  if (fromUserAgentData?.includes("win")) {
    return "windows";
  }
  if (fromUserAgentData?.includes("mac")) {
    return "mac";
  }

  const platform = window.navigator.platform.toLowerCase();
  if (platform.includes("win")) {
    return "windows";
  }
  if (platform.includes("mac")) {
    return "mac";
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.includes("windows")) {
    return "windows";
  }
  if (userAgent.includes("mac os")) {
    return "mac";
  }

  return "other";
}

function getRelevanceScore(slot: DownloadSlot, os: DetectedOS): number {
  if (os === "unknown" || os === "other") {
    return 0;
  }

  return slot.platform === os ? 0 : 1;
}

export function DownloadCards({ slots }: DownloadCardsProps) {
  const [os, setOs] = useState<DetectedOS>("unknown");

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const orderedSlots = useMemo(
    () => [...slots].sort((a, b) => getRelevanceScore(a, os) - getRelevanceScore(b, os)),
    [slots, os],
  );

  return (
    <>
      {orderedSlots.map((slot, idx) => {
        const isApplicable = os === "unknown" || os === "other" ? true : slot.platform === os;
        const animationClass = isApplicable ? "animate-fade-up" : "animate-fade-up-muted";

        return (
          <article
            key={slot.label}
            className={`download-card ${animationClass} ${isApplicable ? "" : "inapplicable"}`}
            style={{ animationDelay: `${360 + idx * 120}ms` }}
          >
            <div>
              <h2>{slot.label}</h2>
              {slot.asset ? (
                <code>{slot.asset.name}</code>
              ) : (
                <p className="muted-note">Not available in this release.</p>
              )}
            </div>
            {slot.asset ? (
              <a
                href={slot.asset.browser_download_url}
                className={`btn ${isApplicable ? "btn-primary" : "btn-ghost"}`}
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
            ) : (
              <span className="btn btn-ghost" aria-disabled="true">
                Unavailable
              </span>
            )}
          </article>
        );
      })}
    </>
  );
}

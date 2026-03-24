"use client";

import { useEffect, useMemo, useState } from "react";
import { UpdateSettingsActions } from "./update-settings-button";
import { compareSemver, parseSemver } from "./semver";

type UpdateBannerProps = {
  latestVersion: string | null;
  settingsUrl: string;
  compact?: boolean;
};

type DetectedInfo = {
  browserName: string;
  browserVersion: string | null;
  miraVersion: string | null;
};

function detectFromUserAgent(userAgent: string): DetectedInfo {
  const miraMatch = userAgent.match(/\bMira\/([\d.]+)\b/);
  if (miraMatch) {
    return { browserName: "Mira", browserVersion: miraMatch[1], miraVersion: miraMatch[1] };
  }

  const edgeMatch = userAgent.match(/\bEdg\/([\d.]+)\b/);
  if (edgeMatch) {
    return { browserName: "Edge", browserVersion: edgeMatch[1], miraVersion: null };
  }

  const chromeMatch = userAgent.match(/\bChrome\/([\d.]+)\b/);
  if (chromeMatch) {
    return { browserName: "Chrome", browserVersion: chromeMatch[1], miraVersion: null };
  }

  const firefoxMatch = userAgent.match(/\bFirefox\/([\d.]+)\b/);
  if (firefoxMatch) {
    return { browserName: "Firefox", browserVersion: firefoxMatch[1], miraVersion: null };
  }

  const safariMatch = userAgent.match(/\bVersion\/([\d.]+).*Safari\b/);
  if (safariMatch) {
    return { browserName: "Safari", browserVersion: safariMatch[1], miraVersion: null };
  }

  return { browserName: "Browser", browserVersion: null, miraVersion: null };
}

export function UpdateBanner({ latestVersion, settingsUrl, compact = false }: UpdateBannerProps) {
  const [detected, setDetected] = useState<DetectedInfo>({
    browserName: "Browser",
    browserVersion: null,
    miraVersion: null,
  });

  useEffect(() => {
    const syncDetect = () => {
      const ua = navigator.userAgent || "";
      const detectedFromUa = detectFromUserAgent(ua);
      const miraFromApi =
        (window as unknown as { mira?: { version?: string } }).mira?.version ??
        (window as unknown as { electron?: { appVersion?: string } }).electron?.appVersion ??
        null;

      setDetected({
        browserName: detectedFromUa.browserName,
        browserVersion: detectedFromUa.browserVersion,
        miraVersion: miraFromApi ?? detectedFromUa.miraVersion,
      });

      return detectedFromUa;
    };

    const detectedFromUa = syncDetect();

    const electronApi = (window as unknown as { electron?: { getAppVersion?: () => Promise<string> } }).electron;
    if (electronApi?.getAppVersion) {
      electronApi
        .getAppVersion()
        .then((version) => {
          if (version) {
            setDetected((current) => ({
              browserName: current.browserName,
              browserVersion: current.browserVersion,
              miraVersion: version,
            }));
          }
        })
        .catch(() => {
          setDetected((current) => ({
            browserName: current.browserName ?? detectedFromUa.browserName,
            browserVersion: current.browserVersion ?? detectedFromUa.browserVersion,
            miraVersion: current.miraVersion ?? detectedFromUa.miraVersion,
          }));
        });
    }
  }, []);

  const isOutdated = useMemo(() => {
    if (!latestVersion || !detected.miraVersion) {
      console.warn(`Malformed version`)
      return false;
    }

    const latest = parseSemver(latestVersion);
    const installed = parseSemver(detected.miraVersion);
    if (!latest || !installed) {
      return false;
    }

    return compareSemver(installed, latest) < 0;
  }, [detected.miraVersion, latestVersion]);

  if (!latestVersion || !isOutdated) {
    return null;
  }

  if (compact) {
    return (
      <a
        href={settingsUrl}
        className="update-banner-compact animate-fade-up"
        style={{ animationDelay: "260ms" }}
      >
        <span className="update-badge">Update Mira</span>
      </a>
    );
  }

  return (
    <div className="notice update-banner animate-fade-up" style={{ animationDelay: "260ms" }}>
      <div>
        <p className="update-banner-title">
          Update available: Mira <strong>{latestVersion}</strong>
        </p>
        <p className="update-banner-subtitle">
          Detected <strong>{detected.browserName}</strong>
          {detected.browserVersion ? ` ${detected.browserVersion}` : ""} with Mira{" "}
          <strong>{detected.miraVersion}</strong>.
        </p>
      </div>
      <UpdateSettingsActions className="update-banner-actions" href={settingsUrl} />
    </div>
  );
}

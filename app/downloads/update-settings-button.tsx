"use client";

import { useState } from "react";

type UpdateSettingsActionsProps = {
  href: string;
  className?: string;
};

export function UpdateSettingsActions({ href, className }: UpdateSettingsActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    window.location.assign(href);
  };

  const handleCopy = async () => {
    if (!navigator?.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={className}>
      <button type="button" className="btn btn-primary update-banner-cta" onClick={handleOpen}>
        Open Settings
      </button>
    </div>
  );
}

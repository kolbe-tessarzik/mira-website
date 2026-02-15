"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PrereleaseToggleProps = {
  checked: boolean;
  disabled?: boolean;
};

export function PrereleaseToggle({
  checked,
  disabled = false,
}: PrereleaseToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleToggle() {
    if (disabled) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    const nextChecked = !checked;

    if (nextChecked) {
      params.set("includePrereleases", "1");
    } else {
      params.delete("includePrereleases");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Include pre-releases"
      onClick={handleToggle}
      disabled={disabled}
      className={`toggle-switch ${checked ? "on" : "off"} ${disabled ? "disabled" : ""}`}
    >
      <span className="toggle-slider" />
    </button>
  );
}

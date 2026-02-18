export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!configured) {
    return "http://localhost:3000";
  }

  return configured.replace(/\/+$/, "");
}

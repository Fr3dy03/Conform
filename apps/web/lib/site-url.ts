const LOCAL_FALLBACK = "http://localhost:3000";

function vercelUrl(env: Record<string, string | undefined>): string | undefined {
  const host =
    env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || env.VERCEL_URL?.trim();
  if (!host) {
    return undefined;
  }
  try {
    return new URL(`https://${host}`).toString();
  } catch {
    return undefined;
  }
}

export function siteUrl(
  env: Record<string, string | undefined> = process.env,
): URL {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidates = [explicit, vercelUrl(env), LOCAL_FALLBACK];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    try {
      return new URL(candidate);
    } catch {
      continue;
    }
  }
  return new URL(LOCAL_FALLBACK);
}

export function siteOrigin(
  env: Record<string, string | undefined> = process.env,
): string {
  return siteUrl(env).origin;
}

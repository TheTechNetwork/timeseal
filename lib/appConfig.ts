/**
 * Centralized Configuration Management
 * Eliminates hardcoded URLs and provides environment-aware configuration
 */

export interface AppConfig {
  appUrl: string;
  allowedOrigins: string[];
  isDevelopment: boolean;
  isProduction: boolean;
}

let cachedConfig: AppConfig | null = null;

/**
 * Gets application configuration from environment variables
 * Falls back to sensible defaults for development
 */
export function getAppConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const isDevelopment = process.env.NODE_ENV !== "production";
  const isProduction = process.env.NODE_ENV === "production";

  // Use runtime variable (no NEXT_PUBLIC_ prefix) with fallback to build-time variable
  const appUrl =
    process.env.APP_URL ||  // Runtime variable (set in wrangler.jsonc)
    process.env.NEXT_PUBLIC_APP_URL ||  // Build-time fallback
    (isDevelopment ? "http://localhost:3000" : "");

  if (!appUrl && isProduction) {
    throw new Error("APP_URL or NEXT_PUBLIC_APP_URL must be set in production");
  }

  // Build allowed origins list - accept any subdomain of the main domain
  const allowedOrigins = [
    appUrl,
    ...(isDevelopment
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : []),
  ].filter(Boolean);

  cachedConfig = {
    appUrl,
    allowedOrigins,
    isDevelopment,
    isProduction,
  };

  return cachedConfig;
}

/**
 * Resets cached configuration (useful for testing)
 */
export function resetAppConfig(): void {
  cachedConfig = null;
}

/**
 * Validates if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Allow requests without origin (same-origin)

  const config = getAppConfig();
  const normalizedOrigin = origin.replace(/\/$/, "");

  // Check exact match
  for (const allowed of config.allowedOrigins) {
    const normalizedAllowed = allowed.replace(/\/$/, "");
    if (normalizedOrigin === normalizedAllowed) {
      return true;
    }
  }

  // Check if origin matches the domain (including www subdomain)
  try {
    const originUrl = new URL(normalizedOrigin);
    const appUrl = new URL(config.appUrl);

    const originHost = originUrl.hostname.replace(/^www\./, "");
    const appHost = appUrl.hostname.replace(/^www\./, "");

    return originHost === appHost;
  } catch (error) {
    // URL parsing failed - invalid origin format
    if (error instanceof TypeError) {
      return false;
    }
    throw error;
  }
}

/**
 * Validates if a referer is allowed
 */
export function isRefererAllowed(referer: string | null): boolean {
  if (!referer) return true; // Allow requests without referer

  try {
    const refererUrl = new URL(referer);
    return isOriginAllowed(refererUrl.origin);
  } catch (error) {
    // URL parsing failed - invalid referer format
    if (error instanceof TypeError) {
      return false;
    }
    throw error;
  }
}

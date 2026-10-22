import {
  officialConfig,
  readConfigFromEnv,
  sanitizeMessage,
  toPublicConfig,
  type PublicConfig,
} from "@conform/chain";

export interface LoadedPublicConfig {
  config: PublicConfig;
  configError: string | null;
}

export function loadPublicConfig(): LoadedPublicConfig {
  try {
    return {
      config: toPublicConfig(readConfigFromEnv()),
      configError: null,
    };
  } catch (error) {
    return {
      config: toPublicConfig(officialConfig()),
      configError: sanitizeMessage(
        error instanceof Error
          ? error.message
          : "The server configuration could not be read.",
        320,
      ),
    };
  }
}

/**
 * Central app branding constants.
 * Update here to rebrand the entire application.
 */
export const APP_NAME = "Orquestra Care";
export const APP_VERSION = "v1.0";
export const APP_TAGLINE = "Gestão de Jornadas Clínicas";

/**
 * Feature flags
 */
export const ENABLE_ROLE_SWITCHER =
  import.meta.env.VITE_ENABLE_ROLE_SWITCHER === "true";
export const DEMO_MODE_ENABLED =
  import.meta.env.VITE_DEMO_MODE === "true";

const allowlistEnv = import.meta.env.VITE_ROLE_SWITCHER_ALLOWLIST;
const allowlistRaw =
  allowlistEnv && allowlistEnv.trim().length > 0
    ? allowlistEnv
    : "dugoncales@gmail.com";

export const ROLE_SWITCHER_ALLOWLIST = allowlistRaw
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

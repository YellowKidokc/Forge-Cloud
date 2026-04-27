export interface Env {
  DB: D1Database;
  DEFAULT_TRANSLATION?: string;
  LOG_LEVEL?: string;
  ANTHROPIC_API_KEY?: string;
}

export type AppBindings = {
  Bindings: Env;
};

export interface Env {
  DATABASE_URL: string;
  DEFAULT_TRANSLATION?: string;
  LOG_LEVEL?: string;
  HYPERDRIVE?: { connectionString: string };
}

export type AppBindings = {
  Bindings: Env;
};

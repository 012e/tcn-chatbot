import { createClient } from "@libsql/client";
import { getConfig } from "@/config";

const config = getConfig();

let turso;
turso = createClient({
  url: config.tursoDatabaseUrl!,
  authToken: config.tursoAuthToken,
});

export const db = turso;

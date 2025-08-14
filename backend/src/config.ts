import { basicAuth } from "hono/basic-auth";
import { z } from "zod";

const configSchema = z
  .object({
    isDevelopment: z.boolean().default(false),
    openaiKey: z.string().nonempty(),
    embeddingModel: z.string().default("text-embedding-3-small"),
    chatModel: z.string().default("gpt-4o-mini"),
    tursoDatabaseUrl: z.url().optional(),
    tursoAuthToken: z.string().nonempty().optional(),
    basicAuth: z.object({
      username: z.string().nonempty(),
      password: z.string().nonempty(),
    }),
  })
  .refine(
    (data) => {
      if (data.isDevelopment) {
        return true;
      }
      return !!data.tursoDatabaseUrl && !!data.tursoAuthToken;
    },
    {
      message: "tursoDatabaseUrl and tursoAuthToken are required in production",
    },
  );

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

function parseConfigFromEnv(envSource: Record<string, any>): Config {
  const isDevelopment = envSource["NODE_ENV"] !== "production";

  return configSchema.parse({
    openaiKey: envSource["OPENAI_API_KEY"],
    isDevelopment,
    embeddingModel: envSource["OPENAI_EMBEDDING_MODEL"],
    chatModel: envSource["OPENAI_CHAT_MODEL"],
    tursoDatabaseUrl: envSource["TURSO_DATABASE_URL"],
    tursoAuthToken: envSource["TURSO_AUTH_TOKEN"],
    basicAuth: {
      username: envSource["BASIC_AUTH_USERNAME"],
      password: envSource["BASIC_AUTH_PASSWORD"],
    },
  });
}

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const envSource = process.env;
  cachedConfig = parseConfigFromEnv(envSource);
  return cachedConfig;
}

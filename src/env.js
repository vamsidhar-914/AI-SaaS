import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DIRECT_URL: z.string().url(),
    KINDE_CLIENT_ID: z.string(),
    KINDE_CLIENT_SECRET: z.string(),
    KINDE_ISSUER_URL: z.string().url(),
    KINDE_SITE_URL: z.string().url(),
    KINDE_POST_LOGOUT_REDIRECT_URL: z.string().url(),
    KINDE_POST_LOGIN_REDIRECT_URL: z.string().url(),
    UPLOADTHING_TOKEN:z.string(),
    PINECONE_API_KEY:z.string(),
    WATSONX_API_KEY:z.string(),
    WATSONX_PROJECT_ID:z.string(),
    WATSONX_EMBEDDING_MODEL: z.string(),
    WATSONX_CHAT_MODEL: z.string(),
    WATSONX_SERVICE_URL:z.string(),
    SUPABASE_PRIVATE_KEY:z.string(),
    SUPABASE_URL:z.string().url()
  },


  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    DIRECT_URL: process.env.DIRECT_URL,
    KINDE_CLIENT_ID: process.env.KINDE_CLIENT_ID,
    KINDE_CLIENT_SECRET: process.env.KINDE_CLIENT_SECRET,
    KINDE_ISSUER_URL: process.env.KINDE_ISSUER_URL,
    KINDE_SITE_URL: process.env.KINDE_SITE_URL,
    KINDE_POST_LOGOUT_REDIRECT_URL: process.env.KINDE_POST_LOGOUT_REDIRECT_URL,
    KINDE_POST_LOGIN_REDIRECT_URL: process.env.KINDE_POST_LOGIN_REDIRECT_URL,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    WATSONX_API_KEY: process.env.WATSONX_API_KEY,
    WATSONX_PROJECT_ID: process.env.WATSONX_PROJECT_ID,
    WATSONX_EMBEDDING_MODEL: process.env.WATSONX_EMBEDDING_MODEL,
    WATSONX_CHAT_MODEL: process.env.WATSONX_CHAT_MODEL,
    WATSONX_SERVICE_URL:process.env.WATSONX_SERVICE_URL,
    SUPABASE_PRIVATE_KEY: process.env.SUPABASE_PRIVATE_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

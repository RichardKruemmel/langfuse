import { prisma } from "@/src/server/db";
import { jsonSchema } from "@/src/utils/zod";
import * as Sentry from "@sentry/nextjs";
import { ProfilingIntegration } from "@sentry/profiling-node";
import type { TransactionEvent } from "@sentry/types";

if (process.env.NEXT_PUBLIC_SENTRY_DSN)
  Sentry.init({
    // debug: true,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.8,

    profilesSampleRate: 0.8, // Profiling sample rate is relative to tracesSampleRate
    integrations: [
      // Add profiling integration to list of integrations
      new ProfilingIntegration(),
      new Sentry.Integrations.Prisma({ client: prisma }),
    ],

    // filter out passwords from the signup request body
    // transaction events are sentry transactions which include logs and spans.
    beforeSendTransaction(transaction: TransactionEvent) {
      if (
        transaction.request &&
        typeof transaction.request.data === "string" &&
        transaction.request.url &&
        transaction.request.url.includes("api/auth/signup")
      ) {
        const jsonBody = jsonSchema.safeParse(transaction.request.data);

        if (
          jsonBody.success &&
          typeof jsonBody.data === "object" &&
          "data" in jsonBody.data
        ) {
          delete jsonBody.data.password;
          transaction.request.data = JSON.stringify(jsonBody.data);
          transaction.request.data = JSON.stringify(jsonBody);
        } else {
          console.log("Signup: Non Json Request body");
        }

        return transaction;
      }

      return transaction;
    },

    // ...

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps
  });

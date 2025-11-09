import { createTRPCReact, createTRPCClient, httpLink } from "@trpc/react-query";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  console.warn(
    "⚠️ No base url found, EXPO_PUBLIC_RORK_API_BASE_URL is not set. Using fallback."
  );
  return "http://localhost:8081";
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          cache: 'no-store',
          headers: {
            ...options?.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      },
    }),
  ],
});

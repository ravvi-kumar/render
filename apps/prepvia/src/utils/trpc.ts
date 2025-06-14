import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import type { AppRouter } from '../../../server/src/routers';

export const queryClient = new QueryClient({
  queryCache: new QueryCache()
});

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include'
        });
      }
    })
  ]
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient
});

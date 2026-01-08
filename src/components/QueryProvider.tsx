"use client";
import { type PropsWithChildren, useRef } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const QueryProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useRef(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false,
        },
      },
    }),
  );

  return (
    <QueryClientProvider client={queryClient.current}>
      {children}
    </QueryClientProvider>
  );
};

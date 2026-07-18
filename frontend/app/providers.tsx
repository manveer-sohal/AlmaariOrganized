"use client";

import { UserProvider } from "@auth0/nextjs-auth0/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <UserProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </UserProvider>
  );
}

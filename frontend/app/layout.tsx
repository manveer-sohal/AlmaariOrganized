"use client";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const client = new QueryClient();

import "./globals.css";

//example of a dataset of clothes, the mao function will load the clothesCard component 3 times, filling in the prop variables

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <QueryClientProvider client={client}>
        <html lang="en">
          <body className="text-gray-900 button-">{children}</body>
        </html>
      </QueryClientProvider>
    </UserProvider>
  );
}

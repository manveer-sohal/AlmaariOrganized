"use client";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import "./globals.css";
import GoogleAnalytics from "./components/GoogleAnalytics";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/driver.js/dist/driver.css"
        />
        <GoogleAnalytics />
      </head>
      <body className="text-gray-900">
        <UserProvider>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </UserProvider>
      </body>
    </html>
  );
}

"use client";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Script from "next/script";

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
          <head>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-4KCQ0WMKMY"
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-4KCQ0WMKMY');
              `}
            </Script>
          </head>
          <body className="text-gray-900 button-">{children}</body>
        </html>
      </QueryClientProvider>
    </UserProvider>
  );
}

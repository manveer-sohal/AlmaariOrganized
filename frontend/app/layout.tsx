import { UserProvider } from "@auth0/nextjs-auth0/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./globals.css";
import GoogleAnalytics from "./components/GoogleAnalytics";

const client = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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

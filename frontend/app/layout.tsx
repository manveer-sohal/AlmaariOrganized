"use client";
import { UserProvider, useUser } from "@auth0/nextjs-auth0/client";
import "./globals.css";
import NavBar from "./components/navBar";
import SideBar from "./components/sideBar";

//example of a dataset of clothes, the mao function will load the clothesCard component 3 times, filling in the prop variables

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </UserProvider>
  );
}

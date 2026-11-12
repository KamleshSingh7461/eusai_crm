import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import EnvBadge from "@/components/EnvBadge";

// Geist for all interface text and headings; Geist Mono for codes and figures.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "EUSAI CRM | Enterprise Business Process Management",
  description: "Advanced enterprise platform for business process management, resource tracking, and high-performance CRM.",
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  }
};

export const viewport: Viewport = {
  themeColor: "#07090D",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, password managers) add attributes to
    // <html>/<body> before React loads. This only ignores attribute differences on these two tags.
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <EnvBadge />
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}

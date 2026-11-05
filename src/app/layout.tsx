import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import EnvBadge from "@/components/EnvBadge";

// Inter for interface text, Plus Jakarta Sans for headings and key numbers.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

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
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">
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

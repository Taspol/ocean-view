import type { Metadata } from "next";
import { Neuton } from "next/font/google";
import AppShell from "@/components/AppShell";
import OfflineProvider from "@/components/OfflineProvider";
import { AuthProvider } from "@/lib/authContext";
import "./globals.css";

const neuton = Neuton({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-neuton",
});

export const metadata: Metadata = {
  title: "Ocean Fishing | Smart Fishery Dashboard",
  description: "High-resolution oceanic data, contour lines, and predicted fishing zones for Smart Fishery.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ocean Fishing",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={neuton.variable}>
        <OfflineProvider />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

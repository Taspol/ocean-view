import type { Metadata } from "next";
import { Neuton } from "next/font/google";
import AppShell from "@/components/AppShell";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={neuton.variable}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

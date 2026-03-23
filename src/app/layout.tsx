import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/lib/authContext";
import "./globals.css";

const notoSans = Noto_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Ocean Fishing | Smart Fishery Dashboard",
  description: "High-resolution oceanic data, contour lines, and predicted fishing zones for Smart Fishery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={notoSans.className}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

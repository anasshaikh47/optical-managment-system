import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppUiProvider } from "@/context/AppUiContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "Optical Store ERP & POS | VisionPulse",
  description:
    "Optical Store Management, Billing & POS System - Precision Optometry, Lab Jobs, Stock Control & Tax Invoicing",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OpticalPOS",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="OpticalPOS" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.className} min-h-screen md:h-full bg-slate-100 text-slate-900 flex md:overflow-hidden antialiased`}
      >
        <AuthProvider>
          <AppUiProvider>
            <AppShell>{children}</AppShell>
          </AppUiProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

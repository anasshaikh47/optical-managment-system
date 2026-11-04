import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AppUiProvider } from "@/context/AppUiContext";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "Optical Store ERP & POS | My Optics Shop",
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
        className={`${inter.className} h-full bg-slate-100 text-slate-900 flex overflow-hidden antialiased`}
      >
        <AppUiProvider>
          <div className="flex h-full w-full overflow-hidden relative">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
              <Header />
              <main className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">
                {children}
              </main>
            </div>
          </div>
        </AppUiProvider>
      </body>
    </html>
  );
}

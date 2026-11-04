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
  themeColor: "#0B132B",
};

export const metadata: Metadata = {
  title: "My Optics Shop | Optical Store ERP & POS Management",
  description:
    "Ultra User-Friendly Optical Clinic, Eyewear Inventory, Refraction Prescription Management & POS System for My Optics Shop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
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

"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If on login or auth pages, render children without sidebar/header/bottomNav
  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth");

  if (isAuthPage) {
    return <main className="h-full w-full overflow-y-auto">{children}</main>;
  }

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <Header />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto w-full">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
